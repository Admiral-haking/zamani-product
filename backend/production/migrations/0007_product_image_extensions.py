from django.core.validators import FileExtensionValidator
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("production", "0006_garrirecord_meat_output_kg")]

    operations = [
        migrations.AlterField(
            model_name="product",
            name="image",
            field=models.ImageField(
                blank=True,
                null=True,
                upload_to="products/%Y/%m/",
                validators=[FileExtensionValidator(["jpg", "jpeg", "png", "webp"])],
                verbose_name="تصویر",
            ),
        ),
    ]
