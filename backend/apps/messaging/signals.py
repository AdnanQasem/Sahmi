from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.messaging.models import Message


@receiver(post_save, sender=Message)
def notify_recipients_on_message(sender, instance, created, **kwargs):
    """Notify every other participant of the conversation when a new message arrives."""
    if not created:
        return
    from apps.notifications.services import notify_on_commit
    from apps.notifications.models import Notification

    for participation in instance.conversation.participants.exclude(user=instance.sender).select_related("user"):
        notify_on_commit(
            recipient=participation.user,
            notification_type=Notification.NotificationType.MESSAGE_RECEIVED,
            title="New message received",
            body="You have a new message.",  # never the body itself
            actor=instance.sender,
            target_type="conversation",
            target_id=str(instance.conversation_id),
        )
