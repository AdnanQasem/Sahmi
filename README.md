
"Sahmi: Connecting hearts and capital to build a sustainable future for innovation in Palestine." (سهمي: ربط القلوب ورؤوس الأموال لبناء مستقبل مستدام للابتكار في فلسطين.)

## Admin workspace

Backend staff accounts are automatically routed to /dashboard/admin after signing in. The workspace supports project review and approval, rejection notes, campaign status changes, project editing and soft deletion, plus category creation, editing, and deletion.

Create a local staff account from the backend directory:

~~~powershell
python manage.py createsuperuser
~~~

Admin access is determined by Django's server-side is_staff flag. It cannot be granted through public registration or profile updates.

