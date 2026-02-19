from django.db import models

class Semester(models.Model):
    NAME_CHOICES = [
        ('Summer', 'Summer'),
        ('Fall', 'Fall'),
        ('Spring', 'Spring'),
    ]
    name = models.CharField(max_length=10, choices=NAME_CHOICES, unique=True)

    def __str__(self):
        return self.name

class AcademicYear(models.Model):
    year = models.IntegerField(unique=True)

    def __str__(self):
        return str(self.year)

class Program(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class Cohort(models.Model):
    name = models.CharField(max_length=100) # e.g., "CS-Fall-2024-GroupA"
    # program = models.ForeignKey(Program, on_delete=models.CASCADE)
    # semester = models.ForeignKey(Semester, on_delete=models.CASCADE)
    # year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.name} ({self.program.name})"

class Course(models.Model):
    code = models.CharField(max_length=20, unique=True) # e.g., CS101
    name = models.CharField(max_length=255)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='courses')

    def __str__(self):
        return f"{self.code} - {self.name}"