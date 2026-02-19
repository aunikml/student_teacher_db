from django.contrib import admin
from .models import Semester, AcademicYear, Program, Cohort, Course

@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ('year',)

@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Cohort)
class CohortAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'program')
    list_filter = ('program',)
    search_fields = ('code', 'name')