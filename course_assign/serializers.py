from rest_framework import serializers
from .models import CourseAssignment
from users.serializers import UserProfileSerializer
# IMPORTANT: Import BatchSerializer from batches app
from batches.serializers import BatchSerializer 

class CourseAssignmentSerializer(serializers.ModelSerializer):
    # Read-only fields for the table display
    course_code = serializers.ReadOnlyField(source='course.code')
    course_name = serializers.ReadOnlyField(source='course.name')
    program_name = serializers.ReadOnlyField(source='batch.program.name') # Program name through batch

    # To get batch_name, semester_name, year_val for the table
    batch_name = serializers.ReadOnlyField(source='batch.cohort.name') # For display in main table

    # --- CRITICAL CHANGE: Nested Serializer for Batch Details ---
    # This will include the full batch object (with its ID and program ID)
    batch_details = BatchSerializer(source='batch', read_only=True)
    
    # Nested faculty data (just IDs are enough for form submission, but details for display)
    faculty_details = UserProfileSerializer(source='faculty', many=True, read_only=True)
    
    # Student count from the batch
    student_count = serializers.IntegerField(source='batch.students.count', read_only=True)

    class Meta:
        model = CourseAssignment
        fields = '__all__'