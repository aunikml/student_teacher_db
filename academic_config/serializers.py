from rest_framework import serializers
from .models import Semester, AcademicYear, Program, Cohort, Course

class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = '__all__'

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'

class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = '__all__'

class CohortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cohort
        fields = ['id', 'name']

class CourseSerializer(serializers.ModelSerializer):
    program_name = serializers.ReadOnlyField(source='program.name')

    class Meta:
        model = Course
        fields = '__all__'