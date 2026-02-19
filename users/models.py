from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        extra_fields.setdefault('must_change_password', False)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    ROLES = (
        ('ADMIN', 'Admin User'),
        ('FACULTY', 'Faculty Member'),
        ('PIM', 'Program Information Manager'),
        ('PS', 'Program Supervisor'),
    )

    username = None # Remove username field
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    designation = models.CharField(max_length=100, blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLES, default='FACULTY')
    
    # Logic for forced password change
    must_change_password = models.BooleanField(default=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"