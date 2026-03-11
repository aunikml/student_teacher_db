from django.db import models
from batches.models import Student

class AlumniRecord(models.Model):
    PROFESSIONAL_SECTOR_CHOICES =[
        ('Private', 'Private'),
        ('Corporate', 'Corporate'),
        ('Government', 'Government'),
        ('NGO', 'NGO'),
        ('INGO', 'INGO'),
        ('Entrepreneur', 'Entrepreneur'),
        ('Performance_Art', 'Performance Art'),
        ('Other', 'Other'),
    ]

    MARITAL_STATUS_CHOICES =[
        ('Single', 'Single'),
        ('Married', 'Married'),
        ('Divorced', 'Divorced'),
        ('Widowed', 'Widowed'),
        ('Other', 'Other'),
    ]

    # --- Imported Fields from Student (Read-Only context) ---
    original_student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='alumni_record')
    student_id = models.CharField(max_length=50, unique=True, editable=False)
    first_name = models.CharField(max_length=100, editable=False)
    last_name = models.CharField(max_length=100, editable=False)
    starting_semester = models.CharField(max_length=50, editable=False)

    # --- Professional Details ---
    concluding_semester = models.CharField(max_length=50, blank=True, null=True) 
    current_occupation = models.CharField(max_length=255, blank=True, null=True)
    current_professional_affiliation = models.CharField(max_length=255, blank=True, null=True)
    professional_sector = models.CharField(max_length=20, choices=PROFESSIONAL_SECTOR_CHOICES, blank=True, null=True)
    # NEW: Captures the dynamic sub-field choice (e.g. "Corporate" or "Primary Education")
    professional_sector_sub_category = models.CharField(max_length=100, blank=True, null=True)

    # --- Location & Personal ---
    current_country_of_residence = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Alumni: {self.first_name} {self.last_name} ({self.student_id})"

    def save(self, *args, **kwargs):
        if not self.pk and self.original_student:
            self.student_id = self.original_student.student_id
            self.first_name = self.original_student.first_name
            self.last_name = self.original_student.last_name
            if self.original_student.batch:
                self.starting_semester = f"{self.original_student.batch.semester.name} {self.original_student.batch.year.year}"
        super().save(*args, **kwargs)


# NEW MODEL: Handles Multiple Further Education Records
class FurtherEducation(models.Model):
    TYPE_CHOICES =[
        ('Undergraduate', 'Undergraduate'),
        ('Post-graduate', 'Post-graduate'),
    ]
    INSTITUTION_TYPE_CHOICES =[
        ('Government', 'Government'),
        ('Private', 'Private'),
    ]

    alumni = models.ForeignKey(AlumniRecord, on_delete=models.CASCADE, related_name='further_educations')
    degree_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    degree_name = models.CharField(max_length=255)
    program_name = models.CharField(max_length=255)
    institution_name = models.CharField(max_length=255)
    institution_type = models.CharField(max_length=50, choices=INSTITUTION_TYPE_CHOICES)
    start_year = models.IntegerField()
    graduation_year = models.IntegerField()

    class Meta:
        ordering = ['-graduation_year']

    def __str__(self):
        return f"{self.degree_name} at {self.institution_name}"