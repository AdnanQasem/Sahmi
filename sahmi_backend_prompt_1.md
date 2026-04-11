# Sahmi Platform - Django REST Framework Backend Development Prompt

---

## PROJECT OVERVIEW

You are a senior Django + Django REST Framework architect tasked with building a **production-grade backend** for **Sahmi** — a digital investment platform connecting impact-driven investors with verified entrepreneurs in crisis-affected regions (primarily Gaza).

The backend must be:
- 🔒 **Secure** (authentication, authorization, data protection)
- ⚡ **High-performance** (optimized queries, caching, async tasks)
- 📊 **Scalable** (proper indexing, pagination, API design)
- 🎯 **Well-documented** (API documentation, code comments)
- 🧪 **Testable** (unit tests, integration tests, fixtures)
- ♿ **Accessible** (proper error handling, meaningful responses)

---

## TECH STACK & ARCHITECTURE

### Core Stack:
- **Django 4.2+** (LTS)
- **Django REST Framework 3.14+**
- **PostgreSQL 14+** (database)
- **Redis 7+** (caching, task queue)
- **Celery 5.3+** (async tasks, background jobs)
- **Gunicorn** (WSGI server)
- **Docker** (containerization)

### Additional Libraries:
- **djangorestframework-simplejwt** (JWT authentication)
- **django-cors-headers** (CORS handling)
- **django-filter** (filtering)
- **drf-spectacular** (API documentation / OpenAPI)
- **celery-beat** (scheduled tasks)
- **pillow** (image processing)
- **requests** (HTTP client for third-party APIs)
- **python-dateutil** (date utilities)
- **python-decouple** (environment variables)

### External Integrations:
- **Groq API** (free LLM for project classification)
- **SendGrid / AWS SES** (email notifications)
- **AWS S3** (file storage)
- **Stripe** (payment processing - optional, can be added later)

---

## DATABASE DESIGN & MODELS

### Core Models:

#### 1. **User Model**
```
Fields:
- id (UUID, primary key)
- username (unique, 50 chars)
- email (unique, verified flag)
- full_name (first + last name)
- phone_number (optional, for WhatsApp/calls)
- user_type (ENUM: investor, entrepreneur, admin)
- password_hash (bcrypt)
- profile_picture (image, S3)
- bio (text, optional)
- country (CharField)
- city (CharField)
- is_active (boolean, default True)
- is_verified (boolean, email verification)
- is_kyc_verified (boolean, KYC/legal verification)
- kyc_document_url (S3 file)
- kyc_verified_at (datetime, nullable)
- created_at (datetime, auto_now_add)
- updated_at (datetime, auto_now)
- last_login (datetime, nullable)

Investor-specific:
- investor_tier (ENUM: bronze, silver, gold, platinum)
- total_invested (decimal, sum of all investments)
- total_returned (decimal, returns earned)
- average_roi (decimal, calculated)
- risk_preference (ENUM: low, medium, high)
- favorite_categories (many-to-many, project categories)

Entrepreneur-specific:
- business_name (CharField)
- business_registration_number (CharField)
- business_category (ForeignKey to Category)
- business_established_date (date)
- business_address (TextField)
- total_funded (decimal, sum of funded projects)
- total_repaid (decimal, sum of repayments)
- reputation_score (decimal, 0-5)
```

#### 2. **Project Model**
```
Fields:
- id (UUID, primary key)
- entrepreneur (ForeignKey to User)
- title (CharField, 100)
- slug (SlugField, unique)
- description (TextField, detailed description)
- short_description (CharField, 200, for cards)
- category (ForeignKey to ProjectCategory)
- location (CharField, e.g., "Gaza City", "Rafah")
- location_governorate (CharField, e.g., "Gaza Strip")
-
Funding Info:
- goal_amount (decimal, target funding)
- funded_amount (decimal, current amount)
- minimum_investment (decimal, e.g., $100)
- expected_roi (decimal, percentage, e.g., 18.5)
- funding_period_days (integer, days to reach goal)
- start_date (datetime, when funding campaign starts)
- end_date (datetime, when funding campaign ends)
- status (ENUM: draft, active, closed, successful, failed, paused)
- is_verified (boolean, admin verification)
- verified_by (ForeignKey to User, admin)
- verified_at (datetime, nullable)
- verification_notes (TextField, optional)

Documents:
- business_plan_url (S3 file, PDF)
- financial_projections_url (S3 file)
- ownership_proof_url (S3 file)
- supporting_documents (many-to-many, Project Documents)

Media:
- cover_image (image, S3)
- project_images (many-to-many, ProjectImage)
- video_url (CharField, YouTube/Vimeo URL)

AI Classification:
- ai_classified_category (CharField, result from Groq)
- ai_confidence_score (decimal, 0-1)
- ai_classification_at (datetime)
- ai_generated_summary (TextField, auto-generated from LLM)

Progress & Tracking:
- milestone_count (integer)
- current_milestone (ForeignKey to Milestone, nullable)
- repayment_status (ENUM: on_track, delayed, completed)
- total_repaid (decimal)
- next_repayment_date (date, nullable)

Metrics:
- view_count (integer, denormalized for performance)
- investor_count (integer, denormalized)
- rating (decimal, 0-5, average of reviews)
- reviews_count (integer)

Metadata:
- created_at (datetime)
- updated_at (datetime)
- deleted_at (datetime, soft delete)

Constraints:
- unique_together: (entrepreneur, slug)
- Index on: status, category, created_at, funded_amount
```

#### 3. **Investment Model**
```
Fields:
- id (UUID, primary key)
- investor (ForeignKey to User)
- project (ForeignKey to Project)
- amount (decimal, investment amount)
- quantity (integer, number of shares/units)
- investment_date (datetime, auto_now_add)
- status (ENUM: pending, confirmed, canceled, completed)
- transaction_id (CharField, from payment processor)
- payment_method (ENUM: card, bank_transfer, paypal)
- expected_return (decimal, calculated: amount * (roi / 100))
- actual_return (decimal, sum of repayments received)
- return_received_at (datetime, nullable)
- notes (TextField, optional)
- created_at (datetime)
- updated_at (datetime)

Constraints:
- unique_together: (investor, project) - one investment per investor per project? Or allow multiple? (define clearly)
- Index on: investor, project, status, investment_date
```

#### 4. **Milestone Model**
```
Fields:
- id (UUID, primary key)
- project (ForeignKey to Project)
- title (CharField, milestone name)
- description (TextField)
- target_date (date)
- actual_completion_date (date, nullable)
- status (ENUM: pending, in_progress, completed, delayed)
- deliverables (TextField, what will be delivered)
- percentage_of_project (decimal, 0-100, what % of project this is)
- funding_released (decimal, how much funding released at this milestone)
- order (integer, sequence order)
- created_at (datetime)
- updated_at (datetime)
```

#### 5. **Repayment Model**
```
Fields:
- id (UUID, primary key)
- investment (ForeignKey to Investment)
- amount (decimal, repayment amount)
- scheduled_date (date)
- actual_payment_date (date, nullable)
- status (ENUM: pending, paid, overdue, canceled)
- payment_method (ENUM: bank_transfer, paypal, card)
- transaction_id (CharField, from payment processor)
- notes (TextField, optional)
- created_at (datetime)
- updated_at (datetime)

Constraints:
- Index on: investment, scheduled_date, status
```

#### 6. **ProjectCategory Model**
```
Fields:
- id (UUID, primary key)
- name (CharField, unique, e.g., "Agriculture", "Retail", "Manufacturing")
- slug (SlugField, unique)
- description (TextField)
- icon_url (image, S3)
- color_hex (CharField, for UI, e.g., "#10B981")
- is_active (boolean)
- created_at (datetime)
```

#### 7. **Document Model**
```
Fields:
- id (UUID, primary key)
- project (ForeignKey to Project)
- title (CharField)
- file_url (S3 file)
- file_type (CharField, pdf, image, doc)
- file_size (integer, in bytes)
- uploaded_by (ForeignKey to User)
- uploaded_at (datetime)
- is_verified (boolean, admin verification)
```

#### 8. **ProjectUpdate/News Model**
```
Fields:
- id (UUID, primary key)
- project (ForeignKey to Project)
- title (CharField)
- content (TextField, markdown supported)
- author (ForeignKey to User, entrepreneur/admin)
- image_url (image, optional)
- created_at (datetime)
- updated_at (datetime)
- is_public (boolean, visible to investors)

Constraints:
- Index on: project, created_at
```

#### 9. **Review/Rating Model**
```
Fields:
- id (UUID, primary key)
- investor (ForeignKey to User)
- project (ForeignKey to Project)
- rating (integer, 1-5)
- comment (TextField, optional)
- verified_purchase (boolean, true if investor invested in this project)
- helpful_count (integer, upvotes)
- created_at (datetime)
- updated_at (datetime)

Constraints:
- unique_together: (investor, project)
- Index on: project, rating, created_at
```

#### 10. **Notification Model**
```
Fields:
- id (UUID, primary key)
- recipient (ForeignKey to User)
- notification_type (ENUM: investment_confirmed, milestone_completed, repayment_received, project_update, etc.)
- title (CharField)
- message (TextField)
- related_object_id (UUID, e.g., investment_id or project_id)
- related_object_type (CharField, e.g., "investment", "project")
- is_read (boolean)
- is_email_sent (boolean)
- created_at (datetime)
- read_at (datetime, nullable)

Constraints:
- Index on: recipient, is_read, created_at
```

#### 11. **AuditLog Model**
```
Fields:
- id (UUID, primary key)
- user (ForeignKey to User, nullable for system actions)
- action (CharField, e.g., "created_project", "verified_project", "made_investment")
- object_type (CharField, e.g., "project", "investment")
- object_id (UUID)
- changes (JSONField, {field_name: [old_value, new_value]})
- ip_address (CharField)
- user_agent (CharField)
- created_at (datetime)

Constraints:
- Index on: user, object_type, created_at
```

#### 12. **Transaction Model**
```
Fields:
- id (UUID, primary key)
- investor (ForeignKey to User)
- type (ENUM: investment, repayment, refund)
- amount (decimal)
- currency (CharField, default "USD")
- payment_method (ENUM: card, bank_transfer, paypal)
- external_transaction_id (CharField, from payment processor)
- status (ENUM: pending, completed, failed)
- error_message (TextField, nullable)
- created_at (datetime)
- completed_at (datetime, nullable)

Constraints:
- Index on: investor, status, created_at
```

---

## API ENDPOINTS STRUCTURE

### Authentication & Users

```
POST   /api/v1/auth/register          (public)
POST   /api/v1/auth/login              (public)
POST   /api/v1/auth/refresh-token      (authenticated)
POST   /api/v1/auth/logout             (authenticated)
POST   /api/v1/auth/verify-email       (public)
POST   /api/v1/auth/resend-verify-email (public)
POST   /api/v1/auth/forgot-password    (public)
POST   /api/v1/auth/reset-password     (public)

GET    /api/v1/users/me                (authenticated)
PUT    /api/v1/users/me                (authenticated)
POST   /api/v1/users/me/avatar         (authenticated, upload image)
POST   /api/v1/users/me/kyc            (authenticated, submit KYC)
GET    /api/v1/users/{id}              (public, limited data)
GET    /api/v1/users/{id}/projects     (public)
GET    /api/v1/users/{id}/investments  (authenticated owner only)
GET    /api/v1/users/{id}/reviews      (public)
```

### Projects

```
GET    /api/v1/projects                (public, paginated, filterable)
POST   /api/v1/projects                (authenticated, entrepreneur only)
GET    /api/v1/projects/{id}           (public)
PUT    /api/v1/projects/{id}           (authenticated, owner only)
DELETE /api/v1/projects/{id}           (authenticated, owner only, soft delete)
PATCH  /api/v1/projects/{id}/status    (authenticated, owner only)

GET    /api/v1/projects/{id}/timeline  (public, milestones)
GET    /api/v1/projects/{id}/investors (authenticated, owner only)
GET    /api/v1/projects/{id}/updates   (public)
POST   /api/v1/projects/{id}/updates   (authenticated, owner only)
GET    /api/v1/projects/{id}/documents (public)
POST   /api/v1/projects/{id}/documents (authenticated, owner only)

GET    /api/v1/projects/{id}/progress  (public)
GET    /api/v1/projects/{id}/stats     (public, view count, investor count, etc.)

Filter Params:
?category=agriculture&location=gaza&status=active&min_roi=15&max_roi=50&sort_by=newest
?search=business+name&funded_min=1000&funded_max=50000
```

### Investments

```
POST   /api/v1/investments             (authenticated, investor only)
GET    /api/v1/investments             (authenticated, investor's own)
GET    /api/v1/investments/{id}        (authenticated, investor only)
GET    /api/v1/projects/{id}/investments (authenticated, owner only)

GET    /api/v1/investments/{id}/repayments (authenticated)
```

### Repayments

```
GET    /api/v1/repayments              (authenticated)
GET    /api/v1/investments/{id}/repayments
GET    /api/v1/repayments/{id}         (authenticated)
```

### Portfolio & Analytics

```
GET    /api/v1/portfolio               (authenticated, investor only)
  Response: {
    total_invested,
    total_returned,
    current_value,
    total_active_investments,
    average_roi,
    breakdown_by_category,
    performance_chart_data
  }

GET    /api/v1/portfolio/performance   (authenticated)
  Response: {
    monthly_returns: [{month, amount}, ...],
    roi_by_project: [...],
    projected_returns: {...}
  }
```

### Projects (Entrepreneur Dashboard)

```
GET    /api/v1/entrepreneur/projects   (authenticated, entrepreneur only)
GET    /api/v1/entrepreneur/projects/{id}/stats
  Response: {
    total_views,
    total_investors,
    funded_percentage,
    recent_investors: [...],
    milestone_progress: [...],
    messages_count: {...}
  }
```

### Reviews & Ratings

```
GET    /api/v1/projects/{id}/reviews   (public)
POST   /api/v1/projects/{id}/reviews   (authenticated, investor only)
GET    /api/v1/reviews/{id}            (public)
PUT    /api/v1/reviews/{id}            (authenticated, owner only)
DELETE /api/v1/reviews/{id}            (authenticated, owner only)
POST   /api/v1/reviews/{id}/helpful    (authenticated)
```

### Notifications

```
GET    /api/v1/notifications           (authenticated)
GET    /api/v1/notifications/unread    (authenticated)
POST   /api/v1/notifications/{id}/read (authenticated)
POST   /api/v1/notifications/read-all  (authenticated)
DELETE /api/v1/notifications/{id}      (authenticated)
GET    /api/v1/notifications/settings  (authenticated)
PUT    /api/v1/notifications/settings  (authenticated)
```

### Admin Endpoints

```
POST   /api/v1/admin/projects/{id}/verify      (admin only)
POST   /api/v1/admin/projects/{id}/reject      (admin only)
POST   /api/v1/admin/users/{id}/verify-kyc     (admin only)
GET    /api/v1/admin/reports/transactions      (admin only)
GET    /api/v1/admin/reports/users             (admin only)
GET    /api/v1/admin/audit-logs                (admin only)
```

### Categories

```
GET    /api/v1/categories              (public)
GET    /api/v1/categories/{id}/stats   (public, count projects, total funded, etc.)
```

### Search & Discovery

```
GET    /api/v1/search                  (public)
  ?q=search+term&type=project,entrepreneur
GET    /api/v1/trending                (public, trending projects)
GET    /api/v1/recommended             (authenticated, for investor)
```

---

## AUTHENTICATION & AUTHORIZATION

### JWT Token Strategy:
- **Access Token:** 15-minute expiration
- **Refresh Token:** 30-day expiration
- **Token Type:** Bearer
- **Payload:**
  ```json
  {
    "sub": "user_id",
    "user_type": "investor|entrepreneur|admin",
    "email": "user@example.com",
    "exp": 1234567890,
    "iat": 1234567890
  }
  ```

### Permission Classes:
```python
- IsAuthenticated: for authenticated endpoints
- IsInvestor: for investor-only endpoints
- IsEntrepreneur: for entrepreneur-only endpoints
- IsAdmin: for admin endpoints
- IsOwner: for resource ownership (project, investment, etc.)
- IsVerified: for verified users (email + KYC)
```

### Rate Limiting:
- **Anonymous Users:** 100 requests/hour
- **Authenticated Users:** 1000 requests/hour
- **Admin:** unlimited

---

## BUSINESS LOGIC & KEY FEATURES

### 1. Project Verification Workflow
```
1. Entrepreneur creates project (draft)
2. Admin reviews documents:
   - Business plan
   - Financial projections
   - Ownership proof
3. AI classification (Groq): automatic categorization + confidence score
4. Manual verification by admin
5. Status changes to "active" and available for investment
6. Notifications sent to investors with similar interests
```

### 2. Investment Flow
```
1. Investor selects project and amount
2. Investment record created (pending)
3. Payment processing:
   - External API call (Stripe/Paypal)
   - Store transaction ID
4. On successful payment:
   - Investment status → confirmed
   - Project funded_amount updated
   - Notifications to entrepreneur + investor
5. Project funded_amount >= goal_amount:
   - Project status → successful
   - Send notification to all investors
   - Create repayment schedule (from milestones)
```

### 3. Repayment Schedule
```
Triggered by: milestone completion
- Calculate repayment per investment: (investment_amount / total_funded) * milestone_funding_released
- Create repayment records
- Schedule notifications
- On payment: transfer funds to investor wallet
```

### 4. AI Project Classification (Groq)
```
Async task (Celery):
1. Extract project description + details
2. Call Groq API with prompt:
   "Classify this project into one of these categories: [list]
    Also provide confidence score (0-1) and summary (1-2 sentences)"
3. Store ai_classified_category, ai_confidence_score, ai_generated_summary
4. Use for recommendations + discovery
```

### 5. Recommendation Engine
```
For each investor:
- Get their favorite_categories + past investments
- Score projects by:
  * Category match (highest score)
  * Risk level match (investor preference)
  * ROI range match (investor expectation)
  * Reputation of entrepreneur
- Return top 10 projects
```

### 6. Notifications System
```
Async tasks (Celery + scheduled):
- Investment confirmed: notify investor + entrepreneur
- Project milestone completed: notify all investors
- Repayment received: notify investor
- Project update published: notify investors
- Project verification complete: notify entrepreneur
- Repayment overdue (daily check): notify investor

Email notifications:
- Digest emails: daily/weekly/monthly
- Real-time for critical events
```

### 7. Audit Logging
```
Log every action:
- User creation/modification
- Project creation/verification/status changes
- Investment creation
- Payment transactions
- Document uploads
- Admin actions

Use signals (Django signals) to auto-log:
```python
@receiver(post_save, sender=Project)
def log_project_changes(sender, instance, created, **kwargs):
    # Log changes
```

---

## ERROR HANDLING & RESPONSES

### Standard Response Format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

Or on error:
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Please provide a valid email",
    "details": {
      "email": ["Enter a valid email address"]
    }
  }
}
```

### HTTP Status Codes:
- 200: OK (successful GET, PUT, PATCH)
- 201: Created (successful POST)
- 204: No Content (successful DELETE)
- 400: Bad Request (validation error)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (permission denied)
- 404: Not Found
- 409: Conflict (e.g., duplicate email)
- 429: Too Many Requests (rate limit)
- 500: Internal Server Error

### Custom Exception Classes:
```python
- ValidationError: field-level errors
- AuthenticationError: auth issues
- PermissionDenied: authorization issues
- NotFound: resource not found
- Conflict: resource already exists
- RateLimitExceeded: rate limiting
```

---

## PERFORMANCE OPTIMIZATION

### Database Optimization:
1. **Select Related (FK):**
   - GET /projects/{id}: select_related('entrepreneur', 'category')
   - GET /investments: select_related('project', 'investor')

2. **Prefetch Related (reverse FK, M2M):**
   - GET /projects/{id}: prefetch_related('milestones', 'documents', 'reviews')

3. **Only/Defer:**
   - List endpoints: use .only('id', 'name', 'slug', 'funded_amount', ...) to reduce data

4. **Indexing:**
   - status (projects)
   - category_id (projects)
   - entrepreneur_id (projects)
   - investor_id (investments)
   - project_id (investments)
   - created_at (for sorting)
   - funded_amount (for sorting)

### Caching Strategy:
```python
- Cache project list (1 hour): category + status filters
- Cache project details (30 minutes): public data
- Cache user profile (5 minutes): public data
- Cache categories (24 hours): static list
- Cache portfolio stats (5 minutes): recalculate on investment change
```

### API Optimization:
1. **Pagination:**
   - Default: 20 items per page
   - Max: 100 items per page
   - Cursor-based pagination for large datasets

2. **Filtering:**
   - category__in=[1,2,3]
   - status=active
   - created_at__gte=2024-01-01
   - Use django-filter for this

3. **Throttling:**
   - 1000 requests/hour for authenticated users

### Image Optimization:
- Store on AWS S3
- Generate thumbnails (150x150, 300x300)
- Use WebP format with fallback

---

## TESTING STRATEGY

### Unit Tests:
```python
- Test each model's methods
- Test serializers validation
- Test permission classes
- Test utility functions
```

### Integration Tests:
```python
- Test complete API flows
- Investment flow: create → verify → confirm
- Project creation → verification → activation
- Repayment flow
```

### Fixtures:
```python
- Test users (investor, entrepreneur, admin)
- Test projects (at various stages)
- Test investments
```

### Coverage Target:
- Minimum 80% code coverage

---

## DEPLOYMENT & DEVOPS

### Docker Setup:
```dockerfile
- Multi-stage build
- Non-root user
- Health checks
- Environment variable management
```

### Environment Variables:
```
DEBUG=False
SECRET_KEY=xxxxx
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_STORAGE_BUCKET_NAME=sahmi-uploads
GROQ_API_KEY=xxxxx
SENDGRID_API_KEY=xxxxx
```

### Logging:
```python
- Structured logging (JSON)
- Log level: DEBUG (dev), INFO (prod)
- Sentry integration for error tracking
```

---

## DOCUMENTATION

### API Documentation (drf-spectacular):
- Auto-generated OpenAPI schema
- Interactive Swagger UI at /api/schema/
- ReDoc at /api/schema/redoc/

### Code Documentation:
```python
- Docstrings for all models, views, serializers
- Type hints for all functions
- README with setup instructions
```

---

## SECURITY CONSIDERATIONS

1. **Input Validation:**
   - All inputs validated (DRF serializers)
   - SQL injection protection (ORM)
   - XSS protection (JSON responses)

2. **HTTPS Only:**
   - Enforce in production
   - HSTS headers

3. **CORS:**
   - Whitelist frontend domains
   - Allow credentials

4. **SQL Injection:**
   - Use ORM (no raw SQL)
   - Parameterized queries

5. **CSRF:**
   - Exempt API endpoints (JWT used instead)

6. **Password Security:**
   - Minimum 8 characters
   - Enforce strong passwords
   - Hash with Django's default (PBKDF2)

7. **Data Protection:**
   - PII encryption at rest
   - Audit logging
   - Soft deletes (GDPR compliance)

8. **Rate Limiting:**
   - Prevent brute force attacks
   - Prevent spam

---

## PROJECT STRUCTURE

```
sahmi-backend/
├── manage.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── config/
│   ├── settings.py
│   ├── settings/
│   │   ├── base.py
│   │   ├── dev.py
│   │   ├── prod.py
│   │   ├── test.py
│   ├── urls.py
│   ├── wsgi.py
│   ├── asgi.py (for WebSocket, optional)
├── apps/
│   ├── users/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── permissions.py
│   │   ├── tests.py
│   │   └── signals.py
│   ├── projects/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── permissions.py
│   │   ├── filters.py
│   │   ├── tests.py
│   │   └── signals.py
│   ├── investments/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── permissions.py
│   │   └── tests.py
│   ├── notifications/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── tasks.py
│   └── core/
│       ├── models.py
│       ├── permissions.py
│       ├── pagination.py
│       ├── renderers.py
│       ├── exceptions.py
│       ├── utils.py
│       └── mixins.py
├── tasks/ (Celery tasks)
│   ├── email_tasks.py
│   ├── ai_tasks.py (Groq integration)
│   ├── payment_tasks.py
│   └── notification_tasks.py
├── tests/
│   ├── conftest.py
│   ├── fixtures/
│   └── factories.py
└── static/ & media/ (ignore, use S3)
```

---

## IMPORTANT CONSIDERATIONS

### Must-Have Features:
✅ User authentication (JWT)
✅ Project CRUD with verification
✅ Investment system
✅ Payment integration (Stripe/Paypal)
✅ Repayment tracking
✅ Notifications
✅ Audit logging
✅ AI classification (Groq)
✅ Admin dashboard APIs
✅ Role-based access control

### Optional (Phase 2):
- Messaging between investors & entrepreneurs
- Advanced analytics
- Mobile app API optimizations
- Webhook support for third-party integrations

### Best Practices to Follow:
1. **DRY:** Don't repeat yourself - use mixins, base classes
2. **SOLID:** Single responsibility, open/closed principle
3. **Separation of Concerns:** Business logic in models/services, API logic in views
4. **Testing:** Write tests as you code
5. **Documentation:** Keep docs up-to-date with code changes
6. **Security:** NEVER skip security checks
7. **Performance:** Profile before optimizing; use caching wisely
8. **Monitoring:** Set up error tracking (Sentry) and logging

---

## EXAMPLE: Creating a New Feature (Reference)

### Step 1: Model (models.py)
```python
class NewFeature(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Step 2: Serializer (serializers.py)
```python
class NewFeatureSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = NewFeature
        fields = ['id', 'title', 'user', 'created_at']
    
    def validate_title(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Title too short")
        return value
```

### Step 3: View (views.py)
```python
class NewFeatureViewSet(viewsets.ModelViewSet):
    queryset = NewFeature.objects.all()
    serializer_class = NewFeatureSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
```

### Step 4: URL (urls.py)
```python
router = DefaultRouter()
router.register(r'features', NewFeatureViewSet)

urlpatterns += router.urls
```

### Step 5: Test (tests.py)
```python
class NewFeatureTests(APITestCase):
    def test_create_feature(self):
        # Test creation logic
```

---

## EXPECTED DELIVERABLES

1. ✅ Fully functional Django REST API
2. ✅ Models with proper relationships
3. ✅ Serializers with validation
4. ✅ Views/ViewSets with permissions
5. ✅ Authentication (JWT)
6. ✅ Filtering, searching, pagination
7. ✅ Celery tasks for async operations
8. ✅ Error handling with proper responses
9. ✅ Unit & integration tests
10. ✅ API documentation (OpenAPI/Swagger)
11. ✅ Docker setup
12. ✅ Environment variable management
13. ✅ Deployment-ready code
14. ✅ Logging & monitoring setup

---

## START DEVELOPMENT WITH THIS APPROACH

1. **Setup:** Django 4.2 + DRF + PostgreSQL + Redis + Docker
2. **Core Models:** User, Project, Investment, Repayment
3. **Authentication:** JWT token setup
4. **Basic CRUD:** User registration + login, Projects CRUD
5. **Investment Flow:** Create investment → verify → confirm
6. **Notifications:** Email notifications (async via Celery)
7. **Testing:** Unit tests for all models
8. **Documentation:** Auto-generated API docs (drf-spectacular)
9. **Deployment:** Docker setup for production

---

**This is a production-grade backend specification. Follow it precisely to build a scalable, secure, and well-structured API for Sahmi.**
