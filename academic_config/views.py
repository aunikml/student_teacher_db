from rest_framework import viewsets, permissions
from .models import Semester, AcademicYear, Program, Cohort, Course
from .serializers import *

class AcademicBaseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]

class SemesterViewSet(AcademicBaseViewSet):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer

class AcademicYearViewSet(AcademicBaseViewSet):
    queryset = AcademicYear.objects.all().order_by('-year')
    serializer_class = AcademicYearSerializer

class ProgramViewSet(AcademicBaseViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer

class CohortViewSet(AcademicBaseViewSet):
    queryset = Cohort.objects.all()
    serializer_class = CohortSerializer

class CourseViewSet(AcademicBaseViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer