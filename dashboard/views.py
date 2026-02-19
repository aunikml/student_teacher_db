from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Q
from batches.models import Student
from academic_config.models import Program

class DashboardStatsView(APIView):
    """
    Aggregates global and program-specific statistics.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. Global Scorecards
        # We count based on the 'status' field in the Student model
        total_students = Student.objects.count()
        total_graduates = Student.objects.filter(status='Graduated').count()
        total_active = Student.objects.filter(status='Active').count()

        # 2. Program-wise Stats
        # We query Programs and 'annotate' them with counts of their related students.
        # The relationship path is: Program -> Batch -> Student (batches__students)
        program_stats = Program.objects.annotate(
            total=Count('batches__students'),
            
            # Count only if status is 'Active'
            active=Count('batches__students', filter=Q(batches__students__status='Active')),
            
            # Count only if status is 'Inactive'
            inactive=Count('batches__students', filter=Q(batches__students__status='Inactive')),
            
            # Count only if status is 'Graduated'
            graduated=Count('batches__students', filter=Q(batches__students__status='Graduated'))
        ).values('id', 'name', 'total', 'active', 'inactive', 'graduated')

        return Response({
            "global": {
                "total": total_students,
                "graduated": total_graduates,
                "active": total_active
            },
            "programs": list(program_stats)
        })