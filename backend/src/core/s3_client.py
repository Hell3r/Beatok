import boto3
from botocore.config import Config
from src.core.config import settings

S3_ENDPOINT = settings.S3_ENDPOINT
S3_ACCESS_KEY = settings.S3_ACCESS_KEY
S3_SECRET_KEY = settings.S3_SECRET_KEY
S3_REGION = settings.S3_REGION
S3_BUCKET = "beatok-bucket"

s3_client = boto3.client(
    's3',
    endpoint_url=S3_ENDPOINT,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
    config=Config(signature_version='s3v4'),
    region_name=S3_REGION
)

__all__ = ['s3_client', 'S3_BUCKET']