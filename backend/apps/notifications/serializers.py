from rest_framework import serializers

from apps.notifications.models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    target_url = serializers.SerializerMethodField()

    def get_target_url(self, obj):
        user = obj.recipient
        role = "admin" if user.is_staff else user.user_type
        dashboard = f"/dashboard/{role}"
        if obj.target_type in {"project", "project_edit"}:
            if obj.target_type == "project_edit" and user.is_staff:
                return "/dashboard/admin/projects#review-queue"
            from apps.projects.models import Project
            project = Project.objects.filter(pk=obj.target_id).only("slug").first()
            return f"/projects/{project.slug}" if project else dashboard
        if obj.target_type == "conversation":
            return f"{dashboard}/messages?conversation={obj.target_id}"
        if obj.target_type == "investment":
            if user.is_staff:
                return "/dashboard/admin/investments"
            if role == "investor":
                return "/dashboard/investor/transactions"
            from apps.investments.models import Investment
            investment = Investment.objects.select_related("project").filter(pk=obj.target_id).first()
            return f"/projects/{investment.project.slug}" if investment else dashboard
        if obj.target_type == "milestone":
            if user.is_staff:
                return "/dashboard/admin/milestones"
            from apps.investments.models import Milestone
            milestone = Milestone.objects.select_related("project").filter(pk=obj.target_id).first()
            return f"/projects/{milestone.project.slug}" if milestone else dashboard
        if obj.target_type == "repayment":
            if user.is_staff:
                return "/dashboard/admin/repayments"
            if role == "investor":
                return "/dashboard/investor/transactions"
            from apps.investments.models import Repayment
            repayment = Repayment.objects.select_related("investment__project").filter(pk=obj.target_id).first()
            return f"/projects/{repayment.investment.project.slug}" if repayment else dashboard
        if obj.target_type == "user":
            return "/dashboard/admin/users" if user.is_staff else f"{dashboard}/settings"
        return dashboard
    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "body",
            "actor",
            "target_type",
            "target_id",
            "read_at",
            "delivery_status",
            "target_url",
            "created_at",
        ]
        read_only_fields = fields


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "in_app_enabled",
            "email_enabled",
            "message_notifications",
            "project_notifications",
            "investment_notifications",
            "milestone_notifications",
            "repayment_notifications",
        ]
        read_only_fields = []  # all listed fields are user-editable preferences
