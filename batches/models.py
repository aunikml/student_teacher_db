from django.db import models
from django.utils import timezone 

# Import models from other apps directly at the top.
from academic_config.models import Program, Semester, AcademicYear, Cohort, Course 
# Use string reference for ForeignKey to break potential circular import
# from course_assign.models import CourseAssignment # No longer needed here

class Batch(models.Model):
    """
    A specific intake or group of students for a particular program, semester, year, and cohort.
    This serves as a container for students in a specific academic offering.
    """
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='batches')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='batches')
    year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='batches')
    cohort = models.ForeignKey(Cohort, on_delete=models.CASCADE, related_name='batches')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('program', 'semester', 'year', 'cohort')
        verbose_name_plural = "Batches" 
        ordering = ['-year__year', '-semester__name', 'program__name', 'cohort__name'] 

    def __str__(self):
        return f"{self.program.name} - {self.cohort.name} ({self.semester.name} {self.year.year})"

class Student(models.Model):
    """
    Individual student records, linked to a specific Batch.
    """
    DEGREE_CHOICES = [
        ('M.Sc', 'M.Sc'), 
        ('PgD', 'PgD'), 
        ('M.ED', 'M.ED')
    ]
    STATUS_CHOICES = [
        ('Active', 'Active'), 
        ('Inactive', 'Inactive'), 
        ('Graduated', 'Graduated')
    ]

    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='students')
    student_id = models.CharField(max_length=50, unique=True, verbose_name="Student ID") 
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    degree_choice = models.CharField(max_length=10, choices=DEGREE_CHOICES)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='Active')
    
    # --- CORRECTED: Removed `default=timezone.now` from here ---
    created_at = models.DateTimeField(auto_now_add=True) 
    updated_at = models.DateTimeField(auto_now=True) 

    class Meta:
        ordering = ['student_id']

    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"


# CRITICAL: Import CourseAssignment from its correct location.
# This assumes course_assign.models does NOT import batches.models.Batch
# If it does, you need to use a string reference 'course_assign.CourseAssignment' below.
from course_assign.models import CourseAssignment 

class StudentCourseEnrollment(models.Model):
    """
    Explicitly links a Student to a specific CourseAssignment instance.
    """
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='course_enrollments')
    course_assignment = models.ForeignKey('course_assign.CourseAssignment', on_delete=models.CASCADE, related_name='student_enrollments')
    
    is_completed = models.BooleanField(default=False)
    
    semester = models.CharField(max_length=10, blank=True, null=True, help_text="Override semester for this student's enrollment")
    year = models.IntegerField(blank=True, null=True, help_text="Override year for this student's enrollment")

    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateField(blank=True, null=True)

    class Meta:
        unique_together = ('student', 'course_assignment') 
        verbose_name = "Student Course Enrollment"
        verbose_name_plural = "Student Course Enrollments"
        ordering = ['student__student_id', 'course_assignment__start_date']

    def __str__(self):
        try:
            course_code = self.course_assignment.course.code
        except AttributeError:
            course_code = "N/A"
            
        student_id = self.student.student_id if self.student else "N/A"
        status = "Completed" if self.is_completed else "Pending"
        return f"{student_id} - {course_code} ({status})"