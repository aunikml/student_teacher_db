import csv
import io
from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import filters # IMPORTANT: Import filters for searching

# Models from other apps
from academic_config.models import Course # Used in course progress calculation in serializer
from course_assign.models import CourseAssignment # Used in course progress calculation and graduation

# Models from this app
from .models import Batch, Student, StudentCourseEnrollment 
from alumni.models import AlumniRecord # IMPORTANT: Import AlumniRecord

# Serializers from this app
from .serializers import BatchSerializer, StudentSerializer, StudentCourseEnrollmentSerializer

# 1. CUSTOM PERMISSION
class IsAdminOrPIM(permissions.BasePermission):
    """
    Allows access only to Admin users or Program Information Managers (PIM).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['ADMIN', 'PIM']


# 2. BATCH VIEWSET
class BatchViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD for Batches.
    Includes custom actions for bulk operations like CSV uploads and status changes.
    """
    queryset = Batch.objects.all().order_by('-created_at')
    serializer_class = BatchSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrPIM]
    
    # Explicitly list parsers for JSON and file uploads
    parser_classes = (JSONParser, MultiPartParser, FormParser) 

    @action(detail=True, methods=['post'])
    def upload_csv(self, request, pk=None):
        batch = self.get_object()
        file = request.FILES.get('file')
        
        if not file:
            return Response(
                {"error": "No file detected. Please upload a .csv file using the 'file' key."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            decoded_file = file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            reader.fieldnames = [name.strip().lower() for name in reader.fieldnames]
            
            required_headers = ['student_id', 'first_name', 'last_name', 'email', 'phone_number', 'degree_choice']
            if not all(h in reader.fieldnames for h in required_headers):
                return Response(
                    {"error": f"CSV is missing required headers. Required: {required_headers}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            students_created = 0
            errors = []

            for row_idx, row in enumerate(reader, start=1):
                try:
                    Student.objects.create(
                        batch=batch,
                        student_id=row['student_id'].strip(),
                        first_name=row['first_name'].strip(),
                        last_name=row['last_name'].strip(),
                        email=row['email'].strip(),
                        phone_number=row['phone_number'].strip(),
                        degree_choice=row['degree_choice'].strip(),
                        status=row.get('status', 'Active').strip()
                    )
                    students_created += 1
                except Exception as e:
                    errors.append({
                        "row": row_idx,
                        "student_id": row.get('student_id', 'Unknown'),
                        "error": str(e)
                    })

            return Response({
                "message": f"Processing complete. {students_created} students created.",
                "total_rows": students_created + len(errors),
                "errors": errors
            }, status=status.HTTP_201_CREATED if students_created > 0 else status.HTTP_207_MULTI_STATUS)

        except Exception as e:
            return Response(
                {"error": f"Failed to parse CSV file: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], url_path='mark-graduated')
    def mark_graduated(self, request, pk=None):
        """
        Bulk action to graduate a batch.
        1. Changes status of all students to 'Graduated'.
        2. Marks all assigned courses for this batch as 'Completed' for every student.
        3. Creates an AlumniRecord for each graduated student if one doesn't exist.
        """
        batch = self.get_object()
        try:
            with transaction.atomic():
                students = batch.students.all()
                updated_count = students.update(status='Graduated')

                alumni_created_count = 0
                for student in students:
                    alumni_record, created = AlumniRecord.objects.get_or_create(
                        original_student=student,
                        defaults={
                            'concluding_semester': f"{batch.semester.name} {batch.year.year}"
                        }
                    )
                    if created:
                        alumni_created_count += 1
                
                assignments = CourseAssignment.objects.filter(batch=batch)
                enrollment_msg = ""
                
                if assignments.exists():
                    enrollment_count = 0
                    for student in students:
                        for assignment in assignments:
                            enrollment, _ = StudentCourseEnrollment.objects.get_or_create(
                                student=student,
                                course_assignment=assignment,
                                defaults={
                                    'semester': assignment.semester, 
                                    'year': assignment.start_date.year
                                }
                            )
                            if not enrollment.is_completed:
                                enrollment.is_completed = True
                                if not enrollment.completed_at:
                                    enrollment.completed_at = timezone.now().date()
                                enrollment.save()
                                enrollment_count += 1
                    enrollment_msg = f", {enrollment_count} course records marked as complete."
                else:
                    enrollment_msg = ". No course assignments were found for this batch (legacy mode)."


            return Response({
                "message": f"Batch graduated successfully. {updated_count} students updated, {alumni_created_count} alumni records created{enrollment_msg}"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='mark-inactive')
    def mark_inactive(self, request, pk=None):
        """
        Bulk action to mark all students in a batch as 'Inactive'.
        """
        batch = self.get_object()
        try:
            count = batch.students.update(status='Inactive')
            return Response({
                "message": f"Batch marked as Inactive. {count} students updated."
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# 3. STUDENT VIEWSET
class StudentViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD for individual students.
    Allows filtering by batch and searching by ID, name, and email.
    """
    queryset = Student.objects.all().order_by('student_id')
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrPIM]
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    
    # --- IMPORTANT: ADDED SEARCH CAPABILITY ---
    filter_backends = [filters.SearchFilter]
    search_fields = ['student_id', 'first_name', 'last_name', 'email']

    def get_queryset(self):
        # Apply filtering for 'batch' if provided in query params
        queryset = super().get_queryset()
        batch_id = self.request.query_params.get('batch')
        if batch_id:
            queryset = queryset.filter(batch_id=batch_id)
        return queryset


# 4. STUDENT COURSE ENROLLMENT VIEWSET
class StudentCourseEnrollmentViewSet(viewsets.ModelViewSet):
    """
    Manages individual student enrollments in specific CourseAssignments.
    This allows manual marking of completion and cross-batch enrollments.
    """
    queryset = StudentCourseEnrollment.objects.all().order_by('student__student_id', 'course_assignment__start_date')
    serializer_class = StudentCourseEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrPIM]
    parser_classes = (JSONParser,)
    filterset_fields = ['student', 'course_assignment']

    def perform_create(self, serializer):
        # Auto-set completed_at date if marking as completed during creation
        if serializer.validated_data.get('is_completed') and not serializer.validated_data.get('completed_at'):
            serializer.validated_data['completed_at'] = timezone.now().date()
        serializer.save()

    def perform_update(self, serializer):
        # Logic to handle toggling completion status and setting/clearing completed_at date
        instance = serializer.instance
        new_status = serializer.validated_data.get('is_completed')

        if instance.is_completed is False and new_status is True:
            # If changing to completed, set date
            serializer.validated_data['completed_at'] = timezone.now().date()
        elif instance.is_completed is True and new_status is False:
            # If changing to incomplete, clear date
            serializer.validated_data['completed_at'] = None
            
        serializer.save()