Сервис для просмотра и управления расписанием занятий центра дополнительного образования.
Аверенков Евгений Артемович 5130904/40105
Духанина Алина Дмитриевна 5130904/40105
Хохрякова Дарья Вячеславовна 5130904/40105
Курбыко Алексей Сергеевич 5130904/40105

# Определение проблемы
Ученикам и преподавателям центра дополнительного образования не хватает единого места, где можно посмотреть актуальное расписание и оперативно узнать о его изменениях, а преподавателям — удобно вносить правки в расписание и сразу оповещать затронутых участников. Сейчас информация и изменения ведутся разрозненно, поэтому расписание приходится отслеживать вручную и уточнять друг у друга, что повышает риск пропустить перенос, отмену или новое занятие и создаёт лишнюю нагрузку на преподавателей.

# Выработка требований


# Разработка архитектуры и детальное проектирование


### 1. Характер нагрузки на сервис

**Исходные данные:**
* Пользователи в сутки: ~10 000 (ученики, преподаватели, родители, администраторы).
* Период хранения информации: > 5 лет.
* Профиль нагрузки: read-heavy (преимущественно чтение).

**Соотношение R/W (Read/Write):**
* **Чтение (Read): 95%** — просмотр расписания группы, списка групп, деталей занятия.
* **Запись (Write): 5%** — изменение расписания преподавателем, создание исключения (перенос/дополнительное/отмена), удаление исключений, регистрация push-токена.

**Объёмы трафика:**
* Запросов в сутки: ~35 000 (10 000 пользователей × 3.5 запроса).
* Средний RPS: ~0.4 (35 000 / 86 400).
* Пиковый RPS: ~8–10 (утро с 8:00 до 9:00 и вечер с 18:00 до 20:00).
* Средний размер ответа: ~2 КБ (JSON с расписанием на неделю).
* Трафик в сутки: ~70 МБ.
* Трафик в месяц: ~2 ГБ.

**Объёмы дисковой системы (за 5 лет):**
* Таблица `groups`: ~200 записей по 0.5 КБ (итого 100 КБ).
* Таблица `schedules`: ~600 записей по 0.5 КБ (итого 300 КБ).
* Таблица `schedule_exceptions`: ~5 000 записей по 0.5 КБ (итого 2.5 МБ).
* Таблица `device_subscriptions`: ~10 000 записей по 0.3 КБ (итого 3 МБ).
* Индексы и служебные данные: ~2 МБ.
* **Итого:** ~8 МБ.
*Вывод:* объём данных за 5 лет — менее 10 МБ, что в 50 раз меньше лимита Supabase Free (500 МБ). Запас огромный.

### 2. C4-диаграммы

#### 2.1. System Context diagram (Уровень 1)
Показывает систему в окружении пользователей и внешних сервисов.

```mermaid
C4Context
  title System Context diagram (Уровень 1)

  Person(student, "Ученик", "Просматривает расписание, получает уведомления")
  Person(parent, "Родитель", "Просматривает расписание ребенка, получает уведомления")
  Person(teacher, "Преподаватель", "Просматривает и изменяет расписание, инициирует уведомления об изменениях")

  System_Boundary(app_boundary, "Система Центра Дополнительного Образования") {
    System(schedule_system, "Приложение расписания", "Единое приложение для просмотра и управления расписанием")
  }

  System_Ext(expo, "Expo Push Service", "Внешняя зависимость для доставки пуш-уведомлений на устройства пользователей")

  Rel(student, schedule_system, "Смотрит расписание")
  Rel(parent, schedule_system, "Смотрит расписание")
  Rel(teacher, schedule_system, "Изменяет расписание")
  
  Rel(schedule_system, expo, "Отправляет запросы на рассылку уведомлений")
  Rel(expo, student, "Доставляет пуш-уведомления")
  Rel(expo, teacher, "Доставляет пуш-уведомления")
```
### 2.1 2.2. Container diagram (Уровень 2)
Показывает внутреннее устройство системы и технологии.

```mermaid
C4Container
  title Container diagram (Уровень 2)

  Person(user, "Пользователь", "Ученик, родитель или преподаватель")

  System_Boundary(c1, "Приложение расписания ЦДО") {
    Container(mobile_app, "Мобильное приложение", "React Native, Expo", "UI для просмотра и изменения расписания")
    Container(backend, "Backend API", "FastAPI (Python)", "Бизнес-логика, REST-эндпоинты, управление уведомлениями")
    ContainerDb(db, "База данных", "PostgreSQL (Supabase)", "Хранение курсов, групп, расписания и токенов устройств")
  }

  System_Ext(expo, "Expo Push Service", "Сервис доставки пуш-уведомлений")

  Rel(user, mobile_app, "Использует", "HTTPS")
  Rel(mobile_app, backend, "Запрашивает данные / отправляет изменения", "JSON/HTTPS")
  Rel(backend, db, "Читает и записывает данные", "SQL/TCP")
  
  Rel(backend, expo, "Отправляет пуш-уведомления", "HTTPS")
```

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
