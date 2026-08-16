from django.db import migrations


def align_payout_reference_column(apps, schema_editor):
    WithdrawalRequest = apps.get_model("investments", "WithdrawalRequest")
    table = WithdrawalRequest._meta.db_table
    with schema_editor.connection.cursor() as cursor:
        columns = {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(cursor, table)
        }
    target = "payout_reference"
    if target in columns:
        return
    previous = next(
        (column for column in columns if column.endswith("_transaction_id")),
        None,
    )
    if previous:
        quote = schema_editor.quote_name
        schema_editor.execute(
            f"ALTER TABLE {quote(table)} RENAME COLUMN {quote(previous)} TO {quote(target)}"
        )


class Migration(migrations.Migration):
    dependencies = [
        ("investments", "0009_reset_underfunded_in_progress_milestones"),
    ]

    operations = [
        migrations.RunPython(align_payout_reference_column, migrations.RunPython.noop),
    ]
