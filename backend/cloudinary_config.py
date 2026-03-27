import os
import cloudinary
import cloudinary.uploader


def configure_cloudinary() -> bool:
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
    api_key = os.environ.get("CLOUDINARY_API_KEY")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET")

    if not cloud_name or not api_key or not api_secret:
        return False

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )
    return True


def upload_file_to_cloudinary(file_data: bytes, filename: str, folder: str):
    return cloudinary.uploader.upload(
        file=file_data,
        public_id=filename,
        folder=folder,
        resource_type="auto",
        overwrite=False,
    )


def delete_file_from_cloudinary(public_id: str):
    for resource_type in ("image", "raw", "video"):
        result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        if result.get("result") == "ok":
            return result
    return {"result": "not_found"}
