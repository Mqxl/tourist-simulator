const goButton = document.getElementById("goButton") as HTMLButtonElement;

const personIcon = new Image();
personIcon.src = "images/person-resized.gif";
const GroupPersonIcon = new Image();
GroupPersonIcon.src = "images/group.gif";
const IMAGE_WIDTH = 15;
const IMAGE_HEIGHT = 15;

// -------------------------
//  DEFINITIONS
// -------------------------

type Coords = { x: number; y: number };

// Формат данных JSON событий
interface ReplayData {
    events: Array<SimEvent>;
    desks: Array<Desk>;
}

interface SimEvent {
    event: "CUSTOMER_ARRIVAL" | "WALK_TO_DESK" | "BUY_TICKETS" | "CUSTOMER_WAITING" | "CUSTOMER_LEAVES";
    time: number;
    deskId?: number;
    deskX?: number;
    deskY?: number;
}

interface SimEventWithId extends SimEvent {
    id: number;
}

// Вес типов событий для правильной сортировки
const EventTypeWeight = {
    CUSTOMER_ARRIVAL: 0,
    CUSTOMER_WAITING: 1,
    WALK_TO_DESK: 2,
    BUY_TICKETS: 3,
    CUSTOMER_LEAVES: 4
};

// Сортировка и присвоение идентификаторов событиям
const SortAndInjectSequentialIDs = (events: Array<SimEvent>): Array<SimEventWithId> => {
    events = events.sort((a, b) => (a.time === b.time ? EventTypeWeight[a.event] - EventTypeWeight[b.event] : a.time - b.time));
    let id = 0;
    return events.map((e) => Object.assign({ id: id++ }, e) as SimEventWithId);
};

// -------------------------
//  CANVAS OBJECTS
// -------------------------

class Desk {
    constructor(public id: number, public x: number, public y: number) {
        this.num = 0;
    }
    num: number;

    draw(ctx: CanvasRenderingContext2D) {
        const width = 70;
        const height = 30;
        ctx.strokeStyle = "black"; // Цвет границы
        ctx.lineWidth = 2; // Толщина
        ctx.strokeRect(this.x, this.y, width, height);
        ctx.fillStyle = "rgba(0, 0, 0, 0)"; // Прозрачный цвет заливки
        ctx.fillRect(this.x, this.y, width, height);
        ctx.fillStyle = "black"; // Цвет текста
        ctx.font = "10px Arial"; // Размер и шрифт текста
        ctx.fillText(`Desk ${this.id}`, this.x, this.y - 5); // Надпись над столом
    }
}


class Person {
    static START_AT: Coords = { x: 100, y: 700 };
    private deskId: number | null = null;
    private deskX: number = 0;
    private deskY: number = 0;

    constructor(private id: number) {}

    draw(ctx: CanvasRenderingContext2D, now: number, event: SimEvent) {
        switch (event.event) {
            case "CUSTOMER_ARRIVAL":
                this.drawArrival(ctx);
                break;
            case "WALK_TO_DESK":
                this.deskId = event.deskId!;
                this.deskX = event.deskX!;
                this.deskY = event.deskY!;
                this.drawWalkToDesk(ctx);
                break;
            case "BUY_TICKETS":
                this.deskId = event.deskId!;
                this.deskX = event.deskX!;
                this.deskY = event.deskY!;
                this.drawBuyTickets(ctx, now);
                updateChart(this.deskId);
                break;
            case "CUSTOMER_WAITING":
                this.deskX = event.deskX!;
                this.deskY = event.deskY!;
                this.drawWaiting(ctx, now);
                break;
            case "CUSTOMER_LEAVES":
                this.drawLeaving(ctx, now);
                break;
        }
    }

    private drawArrival(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(personIcon, Person.START_AT.x, Person.START_AT.y, IMAGE_WIDTH, IMAGE_HEIGHT);
    }
    private drawWalkToDesk(ctx: CanvasRenderingContext2D) {
        const destX = this.deskX + 20;
        const destY = this.deskY + 3;
        const startX = Person.START_AT.x;
        const startY = Person.START_AT.y;
        const duration = 3000; // Длительность анимации в миллисекундах (5 секунд)
        const currentTime = Date.now() - startTime;
        const progress = Math.min(currentTime / duration, 1);
        const distanceX = destX - startX;
        const distanceY = destY - startY;
        const currentX = startX + distanceX * progress;
        const currentY = startY + distanceY * progress;
        ctx.drawImage(personIcon, currentX, currentY, IMAGE_WIDTH, IMAGE_HEIGHT);
        if (progress < 1) {
            requestAnimationFrame(() => this.drawWalkToDesk(ctx));
        }
    }

    private drawBuyTickets(ctx: CanvasRenderingContext2D, now: number) {
        const destX = this.deskX + 20;
        const destY = this.deskY + 3;
        const startX = Person.START_AT.x;
        const startY = Person.START_AT.y;
        const duration = 3000; // Длительность анимации в миллисекундах (5 секунд)
        const currentTime = Date.now() - startTime;
        const progress = Math.min(currentTime / duration, 1);
        const distanceX = destX - startX;
        const distanceY = destY - startY;
        const currentX = startX + distanceX * progress;
        const currentY = startY + distanceY * progress;
        ctx.drawImage(personIcon, currentX, currentY, IMAGE_WIDTH, IMAGE_HEIGHT);
        if (progress < 1) {
            requestAnimationFrame(() => this.drawBuyTickets(ctx, now));
        }
    }

   private drawWaiting(ctx: CanvasRenderingContext2D, now: number) {
    const destX = this.deskX;
    const destY = this.deskY + 40; // Смещаем вниз на 20 пикселей
    const startX = Person.START_AT.x;
    const startY = Person.START_AT.y;
    const duration = 3000; // Длительность анимации в миллисекундах (5 секунд)
    const currentTime = Date.now() - startTime;
    const progress = Math.min(currentTime / duration, 1);
    const distanceX = destX - startX;
    const distanceY = destY - startY;
    const currentX = startX + distanceX * progress;
    const currentY = startY + distanceY * progress;
    ctx.drawImage(GroupPersonIcon, currentX, currentY, IMAGE_WIDTH, IMAGE_HEIGHT);
    if (progress < 1) {
        requestAnimationFrame(() => this.drawWaiting(ctx, now));
    }
}

    private drawLeaving(ctx: CanvasRenderingContext2D, now: number) {
    const destX = canvas.width - IMAGE_WIDTH; // Правый край холста
    const destY = 0; // Верхний край холста
    const startX = this.deskX;
    const startY = this.deskY;
    const duration = 3000; // Длительность анимации в миллисекундах (5 секунд)
    const currentTime = Date.now() - startTime;
    const progress = Math.min(currentTime / duration, 1);
    const distanceX = destX - startX;
    const distanceY = destY - startY;
    const currentX = startX + distanceX * progress; // Оставляем прогресс без изменений для движения в противоположном направлении
    const currentY = startY + distanceY * progress;// Инвертируем прогресс для движения от стола к выходу

    globalDesks.forEach((desk) => {
        desk.draw(ctx);
    });
    ctx.fillText(`T = ${now.toFixed(2)} minutes`, 5, 15); // Отрисовываем время

    // Отрисовываем кастомера
    ctx.drawImage(personIcon, currentX, currentY, IMAGE_WIDTH, IMAGE_HEIGHT);

    if (progress < 1) {
        requestAnimationFrame(() => this.drawLeaving(ctx, now));
    }
}
}

// Глобальная переменная, содержащая массив столов
let globalDesks: Desk[] = [];
let chart: any;

// Функция для отрисовки графика
const drawChart = (desks) => {
    const canvas = document.getElementById("chart") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");

    const labels = desks.map((desk, index) => `Desk ${index + 1}`);
    const data = desks.map(desk => desk.num);

    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Customers served',
                backgroundColor: 'rgb(255, 99, 132)',
                borderColor: 'rgb(255, 99, 132)',
                data: data,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    };

    if (chart) {
        chart.destroy();
    }
    chart = new (window as any).Chart(ctx, config);
};

// Функция для обновления данных графика по deskId
const updateChart = (deskId: number) => {
    const desk = globalDesks.find(desk => desk.id === deskId);
    if (desk) {
        desk.num++;
        drawChart(globalDesks);
    }
};

// -------------------------
//  CANVAS LOGIC
// -------------------------

let startTime = 0;
const canvas = document.getElementById("animate") as HTMLCanvasElement;
const Run = async (sourceFile: string, speed: number) => {

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("no context?");
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = (await (await fetch(sourceFile)).json()) as ReplayData;
    const events = SortAndInjectSequentialIDs(data.events);
    const desksData = data.desks;
    const desks: Desk[] = [];
    for (let i = 0; i < desksData.length; i++) {
        const deskData = desksData[i];
        const desk = new Desk(i + 1, deskData.x, deskData.y);
        desks.push(desk);
    }
    globalDesks = desks;
    drawChart(globalDesks);

    const begin = Date.now();
    let processedEvents: number[] = [];
    let drawnInitial: boolean = false
    const Draw = () => {
    const now = (Date.now() - begin) / 1000 / speed;

    // Проверяем, были ли столы и время уже отрисованы
    if (!drawnInitial) {
        // Отрисовываем столы
        desks.forEach((desk) => {
            desk.draw(ctx);
        });

        // Помечаем, что столы и время были отрисованы
        drawnInitial = true;
    }
    // Отрисовываем время
    ctx.clearRect(0, 0, 200, 20); // Очищаем область, где отображается время
    ctx.fillText(`T = ${now.toFixed(2)} minutes`, 5, 15);

    // Обработка каждого события
    events.forEach((event) => {
        // Проверяем, было ли уже обработано это событие
        if (processedEvents.indexOf(event.id) !== -1) return;

        // Если ивент еще не обработан, то выполняем его обработку
        if (event.id !== 0 && event.time <= now) {
            const deskId = event.deskId - 1; // Поправка на индексацию столов, начиная с 0
            if (deskId >= 0 && deskId < desks.length) {
                const deskData = desksData[deskId];
                const eventWithCoords = { ...event, deskX: deskData.x, deskY: deskData.y };
                const newPerson = new Person(event.id);
                newPerson.draw(ctx, now, eventWithCoords);

                // Добавляем идентификатор обработанного события в список
                processedEvents.push(event.id);
            }
        }
    });

    // Проверяем, остались ли еще события для обработки
    if (events.length === 0) {
        // Если нет, то останавливаем анимацию
        return;
    }

    // Проверяем, должны ли мы продолжать анимацию
    if (now < events[events.length - 1].time) {
        requestAnimationFrame(Draw);
    }
};


    startTime = Date.now();
    Draw();
};

goButton.addEventListener("click", function () {
    const file = "output/events.json"
    const speed = parseInt((document.getElementById("speed") as HTMLInputElement).value, 10);
    Run(file, speed);
});
