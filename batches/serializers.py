from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from .models import Batch, Student, StudentCourseEnrollment # IMPORTANT: Import new model
from academic_config.models import Course # Import Course model
from course_assign.models import CourseAssignment # Import CourseAssignment model

# --- 1. Helper Serializer for Course Progress Display ---
class CourseProgressItemSerializer(serializers.Serializer):
    """
    A simple, explicit serializer to structure individual course items 
    within the student's overall course progress list.
    """
    code = serializers.CharField(max_length=20)
    name = serializers.CharField(max_length=255)
    status = serializers.CharField(max_length=15) # e.g., "Completed", "Pending"
    semester = serializers.CharField(max_length=10) # e.g., "Fall", "Spring", "-"
    year = serializers.IntegerField() # e.g., 2026, or -1 if not set
    enrollment_id = serializers.IntegerField(required=False, allow_null=True) # ID of the StudentCourseEnrollment object


# --- 2. Serializer for the NEW StudentCourseEnrollment Model ---
class StudentCourseEnrollmentSerializer(serializers.ModelSerializer):
    """
    Serializer for the StudentCourseEnrollment model.
    Provides read-only fields for related course and assignment details.
    """
    # Read-only fields to get details from related CourseAssignment and Course
    course_code = serializers.ReadOnlyField(source='course_assignment.course.code')
    course_name = serializers.ReadOnlyField(source='course_assignment.course.name')
    
    # Semester and Year from the CourseAssignment, if the enrollment itself doesn't override them
    assignment_semester = serializers.ReadOnlyField(source='course_assignment.semester')
    assignment_year = serializers.ReadOnlyField(source='course_assignment.start_date.year')

    class Meta:
        model = StudentCourseEnrollment
        fields = [
            'id', 
            'student', 
            'course_assignment', 
            'course_code', 
            'course_name',
            'is_completed', 
            'semester', 
            'year',
            'assignment_semester', # Provides the default from the assignment
            'assignment_year',    # Provides the default from the assignment
            'enrolled_at', 
            'completed_at'
        ]
        read_only_fields = ['enrolled_at', 'completed_at', 'course_code', 'course_name', 'assignment_semester', 'assignment_year']


# --- 3. Main Student Serializer (Updated for Course Progress Logic) ---
class StudentSerializer(serializers.ModelSerializer):
    """
    Serializer for Student records.
    The 'course_progress' field now accurately reflects explicit enrollments.
    """
    course_progress = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 
            'batch', 
            'student_id', 
            'first_name', 
            'last_name', 
            'email', 
            'phone_number', 
            'degree_choice', 
            'status', 
            'course_progress'
        ]

    def get_course_progress(self, student_obj):
        """
        Calculates a student's curriculum progress based on:
        1. All courses defined for the student's `Program` (from their `Batch`).
        2. Any `StudentCourseEnrollment` records explicitly created for this student.

        If an explicit `StudentCourseEnrollment` exists for a `course`, its status, 
        semester, and year are used. Otherwise, the course is marked 'Pending'.
        """
        try:
            program = student_obj.batch.program
            
            # 1. Get all courses required for this program
            required_courses_for_program = Course.objects.filter(program=program)
            
            # 2. Get all explicit enrollments for *this specific student*
            # We use a dictionary for quick lookup by course_id
            explicit_enrollments_map = {}
            for enrollment in StudentCourseEnrollment.objects.filter(student=student_obj):
                explicit_enrollments_map[enrollment.course_assignment.course_id] = enrollment

            progress_data = []
            for course_in_program in required_courses_for_program:
                enrollment_record = explicit_enrollments_map.get(course_in_program.id)
                
                status_text = "Pending"
                semester_display = "-"
                year_display = "-"
                enrollment_id = None

                if enrollment_record:
                    # If an explicit enrollment exists, use its data
                    status_text = "Completed" if enrollment_record.is_completed else "Pending"
                    semester_display = enrollment_record.semester if enrollment_record.semester else enrollment_record.course_assignment.semester
                    year_display = enrollment_record.year if enrollment_record.year else enrollment_record.course_assignment.start_date.year
                    enrollment_id = enrollment_record.id
                else:
                    # Fallback: if no explicit enrollment, check if the course is assigned to the batch
                    # This provides the base 'Pending' if the course is assigned to the batch but no student enrollment exists yet
                    course_assignment = CourseAssignment.objects.filter(batch=student_obj.batch, course=course_in_program).first()
                    if course_assignment:
                        semester_display = course_assignment.semester
                        year_display = course_assignment.start_date.year


                progress_data.append({
                    "code": course_in_program.code,
                    "name": course_in_program.name,
                    "status": status_text,
                    "semester": semester_display,
                    "year": year_display,
                    "enrollment_id": enrollment_id, # Pass enrollment ID for potential editing
                    # Store course_assignment_id to create a new StudentCourseEnrollment if needed
                    "course_id_for_enrollment": course_in_program.id # This is the Course ID from academic_config
                })
            
            # Use our explicit CourseProgressItemSerializer to format the list
            serializer = CourseProgressItemSerializer(instance=progress_data, many=True)
            return serializer.data
        except Exception as e:
            # Log the error for debugging, but return an empty list to prevent frontend crash
            print(f"Error getting course progress for student {student_obj.id}: {e}")
            return []


# --- 4. Batch Serializer (Remains as is) ---
class BatchSerializer(serializers.ModelSerializer):
    """
    Serializer for Batch records.
    Includes a UniqueTogetherValidator for clear error messages on duplicate entries.
    """
    program_name = serializers.ReadOnlyField(source='program.name')
    semester_name = serializers.ReadOnlyField(source='semester.name')
    year_val = serializers.ReadOnlyField(source='year.year')
    cohort_name = serializers.ReadOnlyField(source='cohort.name')
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Batch
        fields = '__all__'
        validators = [
            UniqueTogetherValidator(
                queryset=Batch.objects.all(),
                fields=['program', 'semester', 'year', 'cohort'],
                message="A batch with this exact Program, Semester, Year, and Cohort already exists. Please choose a different combination."
            )
        ]

    def get_student_count(self, obj):
        return obj.students.count()