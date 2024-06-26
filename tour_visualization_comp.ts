const goButton = document.getElementById("goButton") as HTMLButtonElement;

const personIcon = new Image();
personIcon.src = "images/person-icon.png";
const IMAGE_WIDTH = 25;
const IMAGE_HEIGHT = 25;

const SELLER_WIDTH = 22;
const SCANNER_WIDTH = 10;

// -------------------------
//  DEFINITIONS
// -------------------------

type Coords = { x: number; y: number };

// Format of the JSON event data
interface ReplayData {
    sellerLines: number;
    scannerLines: number;
    events: Array<SimEvent>;
    desks: Array<Desk>;
}

interface SimEvent {
    event: "CUSTOMER_ARRIVAL" | "WALK_TO_DESK" | "BUY_TICKETS";
    time: number;
    deskId?: number;
}

interface SimEventWithId extends SimEvent {
    id: number;
}

// Events always take place in this order
const EventTypeWeight = {
    CUSTOMER_ARRIVAL: 0,
    WALK_TO_DESK: 1,
    BUY_TICKETS: 2
};

const SortAndInjectSequentialIDs = (events: Array<SimEvent>): Array<SimEventWithId> => {
    events = events.sort((a, b) => (a.time === b.time ? EventTypeWeight[a.event] - EventTypeWeight[b.event] : a.time - b.time));
    let id = 0;
    return events.map((e) => Object.assign({ id: id++ }, e) as SimEventWithId);
};

// -------------------------
//  CANVAS OBJECTS
// -------------------------
class Desk {
    constructor(private id: number, private position: Coords) {
        this.num = 0;
    }
    x: number;
    y: number;
    num: number;

    getId () {
        return this.id
    }
    draw(ctx: CanvasRenderingContext2D) {
        const width = 50;
        const height = 30;
        ctx.strokeStyle = "black"; // Цвет границы
        ctx.lineWidth = 2; // Толщина
        ctx.strokeRect(this.position.x, this.position.y, width, height);
        ctx.fillStyle = "rgba(0, 0, 0, 0)"; // Прозрачный цвет заливки
        ctx.fillRect(this.position.x, this.position.y, width, height);
        ctx.fillStyle = "black"; // Цвет текста
        ctx.font = "10px Arial"; // Размер и шрифт текста
        ctx.fillText(`Desk ${this.id}`, this.position.x, this.position.y - 5); // Надпись над столом
    }
}

class Person {
    static START_AT: Coords = { x: 100, y: 700 };
    private deskId: number | null = null;

    constructor(private id: number) {}

    get getId(): number {
        return this.id;
    }

    draw(ctx: CanvasRenderingContext2D, now: number, event: SimEvent) {
        switch (event.event) {
            case "CUSTOMER_ARRIVAL":
                this.drawArrival(ctx);
                break;
            case "WALK_TO_DESK":
                this.deskId = event.deskId!;
                this.drawWalkToDesk(ctx);
                break;
            case "BUY_TICKETS":
                this.deskId = event.deskId!;
                this.drawBuyTickets(ctx, now);
                updateChart(this.deskId)
                break;
        }
    }

    private drawArrival(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(personIcon, Person.START_AT.x, Person.START_AT.y, IMAGE_WIDTH, IMAGE_HEIGHT);
    }

    private drawWalkToDesk(ctx: CanvasRenderingContext2D) {
        if (this.deskId === null) return;
        const destX = this.deskId * 100;
        const destY = 200;
        const startX = Person.START_AT.x;
        const startY = Person.START_AT.y;

        const duration = 5000; // Длительность анимации в миллисекундах (5 секунд)
        const currentTime = Date.now() - startTime;
        const progress = Math.min(currentTime / duration, 1);

        const distanceX = destX - startX;
        const distanceY = destY - startY;

        const currentX = startX + distanceX * progress;
        const currentY = startY + distanceY * progress;

        ctx.drawImage(personIcon, currentX, currentY, IMAGE_WIDTH, IMAGE_HEIGHT);

        if (progress < 1) {
            // Если анимация не завершена, продолжаем отрисовывать следующие кадры анимации
            requestAnimationFrame(() => this.drawWalkToDesk(ctx));
        }
    }

    private moveMoneyIconToCenter(ctx: CanvasRenderingContext2D, currentX: number, currentY: number, now: number) {
    const destX = currentX; // Центрирование по X
    const destY = currentY - 30; // Центрирование по Y с небольшим смещением вверх
    const startX = Person.START_AT.x;
    const startY = Person.START_AT.y;

    const duration = 2000; // Длительность анимации перемещения в миллисекундах (2 секунды)
    const progress = Math.min((now - startTime) / duration, 1);

    const distanceX = destX - startX;
    const distanceY = destY - startY;

    const currentXCentered = startX + distanceX * progress;
    const currentYCentered = startY + distanceY * progress;

    return { x: currentXCentered, y: currentYCentered };
}

private drawBuyTickets(ctx: CanvasRenderingContext2D, now: number) {
    if (this.deskId === null) return;

    const destX = this.deskId * 200 + 25; // Предположим, что каждый стол находится на расстоянии 200 пикселей друг от друга
    const destY = 200 + 35; // Предположим, что высота стола 70 пикселей
    const startX = Person.START_AT.x;
    const startY = Person.START_AT.y;

    const duration = 2000; // Длительность анимации покупки в миллисекундах (2 секунды)
    const progress = Math.min((now - startTime) / duration, 1);

    const distanceX = destX - startX;
    const distanceY = destY - startY;

    const currentX = startX + distanceX * progress;
    const currentY = startY + distanceY * progress;

    // Рисуем иконку денег
    const moneyIcon = new Image();
    moneyIcon.src = "путь_к_изображению_иконки_денег.png"; // Путь к изображению иконки денег
    const moneyIconWidth = 50;
    const moneyIconHeight = 50;

    const moneyIconX = currentX - moneyIconWidth / 2;
    const moneyIconY = currentY - moneyIconHeight / 2;

    ctx.drawImage(moneyIcon, moneyIconX, moneyIconY, moneyIconWidth, moneyIconHeight); // Рисуем иконку денег
    ctx.drawImage(personIcon, currentX, currentY, IMAGE_WIDTH, IMAGE_HEIGHT); // Рисуем человека

    // Если анимация не завершена, продолжаем отрисовывать следующие кадры анимации
    if (progress < 1) {
        requestAnimationFrame(() => this.drawBuyTickets(ctx, now));
    } else {
        // Если анимация завершена, удаляем человека
        this.deskId = null;
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
        chart.destroy(); // Уничтожаем старый график перед созданием нового
    }
    chart = new (window as any).Chart(ctx, config);
};

// Функция для обновления данных графика по deskId
const updateChart = (deskId: number) => {
    // Находим стол по deskId
    const desk = globalDesks.find(desk => desk.getId() === deskId);
    if (desk) {
        // Увеличиваем количество клиентов на столе
        desk.num++;
        // Вызываем функцию для перерисовки графика с обновленными данными
        drawChart(globalDesks);
    }
};

// -------------------------
//  CANVAS LOGIC
// -------------------------

let startTime = 0;
const walkDuration = 3000; // 3 seconds

const Run = async (sourceFile: string, speed: number) => {
    const canvas = document.getElementById("animate") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("no context?");
        return;
    }

    const data = (await (await fetch(sourceFile)).json()) as ReplayData;
    const events = SortAndInjectSequentialIDs(data.events);
    const desksData = data.desks;
    const desks: Desk[] = [];
    for (let i = 0; i < desksData.length; i++) {
        const deskData = desksData[i];
        const desk = new Desk(i + 1, { x: deskData.x, y: deskData.y });
        desks.push(desk);
    }
    globalDesks = desks
    drawChart(globalDesks);

    const begin = Date.now();

    const Draw = () => {
    const now = (Date.now() - begin) / 1000 / speed;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desks.forEach((desk) => {
        desk.draw(ctx);
    });
    ctx.fillText(`T = ${now.toFixed(2)} minutes`, 5, 15);

    events.forEach((event) => {
        if (event.id === 0) return;

        if (event.time <= now) {
            let deskId = event.deskId ; // Поправка на индексацию столов, начиная с 0
            if (deskId >= 0 && deskId < desks.length) { // Проверка наличия стола в массиве desks
                const newPerson = new Person(event.id);
                newPerson.draw(ctx, now, { ...event, deskId }); // Передача скорректированного deskId в метод draw
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
    const file = (document.getElementById("file") as HTMLSelectElement).value;
    const speed = parseInt((document.getElementById("speed") as HTMLInputElement).value, 10);
    Run(file, speed);
});
