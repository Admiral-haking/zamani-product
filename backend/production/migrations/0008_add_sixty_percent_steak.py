from django.db import migrations


def add_steak(apps, schema_editor):
    Product = apps.get_model("production", "Product")
    Product.objects.get_or_create(
        name="استیک ۶۰ درصد",
        defaults={"is_active": True},
    )


class Migration(migrations.Migration):
    dependencies = [("production", "0007_product_image_extensions")]

    operations = [migrations.RunPython(add_steak, migrations.RunPython.noop)]
