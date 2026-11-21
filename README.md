Сервис для просмотра и управления расписанием занятий центра дополнительного образования.
Краткое описание функционала (MVP):
Экран выбора роли: родитель или администратор.
Родитель: выбирает группу, видит её расписание, получает push-уведомления при изменении расписания.
Администратор: изменяет расписание через механизм исключений (отмена/перенос конкретного занятия), что автоматически триггерит push-уведомление родителям этой группы.
Описание технологического стека:
Серверная часть: Python 3.10, FastAPI, SQLAlchemy ORM.
База данных: PostgreSQL 15.
UI: React Native (Expo, managed workflow) — мобильное приложение для Android.
Внешняя зависимость: Expo Push Service — внешний сервис для отправки push-уведомлений. При изменении расписания бэкенд отправляет уведомление через Expo Push API всем подписчикам группы. Мобильное приложение регистрирует устройство и получает Expo Push Token, который сохраняется в базе данных. Expo Push Service самостоятельно доставляет уведомления через FCM (Android).
Инфраструктура: Docker, docker-compose, деплой бэкенда на Render.
Оценка нагрузки: ~10 000 пользователей в сутки, период хранения данных — более 5 лет. Характер нагрузки — read-heavy (большинство операций — чтение расписания).

```mermaid
erDiagram
    COURSES ||--o{ GROUPS : "содержит"
    TEACHERS ||--o{ GROUPS : "преподает"
    GROUPS ||--o{ SCHEDULES : "имеет занятия"
    GROUPS ||--o{ DEVICE_SUBSCRIPTIONS : "имеет подписчиков"
    GROUPS ||--o{ SCHEDULE_EXCEPTIONS : "имеет исключения"
    SCHEDULES ||--o{ SCHEDULE_EXCEPTIONS : "имеет изменения"

    COURSES {
        int id PK
        string title
        string age
        string duration
        string type
        int price
        string enrollment_url
        string description
        bool has_places
        string materials
    }

    TEACHERS {
        int id PK
        string name
        string bio
        string photo_url
    }

    GROUPS {
        int id PK
        string name
        string number
        int study_year
        int course_id FK
        string duration
        int teacher_id FK
    }

    SCHEDULES {
        int id PK
        int group_id FK
        string day_of_week
        string start_time
        string end_time
        string time
        string room
        string teacher
    }

    SCHEDULE_EXCEPTIONS {
        int id PK
        int group_id FK
        int schedule_id FK
        date exception_date
        string status
        date new_date
        string new_start_time
        string new_end_time
        string new_room
        string new_teacher
        string reason
    }

    DEVICE_SUBSCRIPTIONS {
        int id PK
        string fcm_token
        int group_id FK
    }
```
