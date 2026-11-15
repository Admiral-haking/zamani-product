from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("production", "0008_add_sixty_percent_steak")]

    operations = [
        migrations.AddField(
            model_name="productionrecord",
            name="produced_meat_kg",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("0"),
                max_digits=12,
                validators=[MinValueValidator(Decimal("0"))],
                verbose_name="وزن گوشت تولید شده (کیلوگرم)",
            ),
        ),
    ]
