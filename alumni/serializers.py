from rest_framework import serializers
from .models import AlumniRecord, FurtherEducation

class FurtherEducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = FurtherEducation
        fields = '__all__'

class AlumniRecordSerializer(serializers.ModelSerializer):
    # Fetch related Further Education records automatically
    further_educations = FurtherEducationSerializer(many=True, read_only=True)
    
    original_student_email = serializers.ReadOnlyField(source='original_student.email')
    # Fetch BRAC IED details directly from the related student's batch
    brac_program_name = serializers.ReadOnlyField(source='original_student.batch.program.name')

    class Meta:
        model = AlumniRecord
        fields = '__all__'
        read_only_fields =[
            'student_id', 'first_name', 'last_name', 'starting_semester', 
            'original_student_email', 'brac_program_name', 'created_at', 'updated_at'
        ]