var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const goButton = document.getElementById("goButton");
const personIcon = new Image();
personIcon.src = "images/person-resized.gif";
const GroupPersonIcon = new Image();
GroupPersonIcon.src = "images/group.gif";
const IMAGE_WIDTH = 15;
const IMAGE_HEIGHT = 15;
let duration = 5;
// Вес типов событий для правильной сортировки
const EventTypeWeight = {
    CUSTOMER_ARRIVAL: 0,
    CUSTOMER_WAITING: 1,
    WALK_TO_DESK: 2,
    BUY_TICKETS: 3,
    CUSTOMER_LEAVES: 4
};
// Сортировка и присвоение идентификаторов событиям
const SortAndInjectSequentialIDs = (events) => {
    events = events.sort((a, b) => (a.time === b.time ? EventTypeWeight[a.event] - EventTypeWeight[b.event] : a.time - b.time));
    let id = 0;
    return events.map((e) => Object.assign({ id: id++ }, e));
};
// -------------------------
//  CANVAS OBJECTS
// -------------------------
class Desk {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.num = 0;
    }
    draw(ctx) {
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
let waitingDrawn = false;
let walkToDeskDrawn = false;
class Person {
    constructor(id, events) {
        this.id = id;
        this.deskId = null;
        this.deskX = 0;
        this.deskY = 0;
        this.currentEventId = 0; // Добавленное свойство для хранения текущего идентификатора события
        this.leavingAnimationStartTime = null;
        this.leavingAnimationStartX = 0;
        this.leavingAnimationStartY = 0;
        this.events = events;
    }
    getNextEvent() {
        const currentEventIndex = this.events.findIndex(event => event.id === this.currentEventId);
        if (currentEventIndex !== -1 && currentEventIndex < this.events.length - 1) {
            return this.events[currentEventIndex + 1];
        }
        else {
            return null;
        }
    }
    getPreviousEvent() {
        const currentEventIndex = this.events.findIndex(event => event.id === this.currentEventId);
        if (currentEventIndex > 0) {
            return this.events[currentEventIndex - 1];
        }
        else {
            return null;
        }
    }
    draw(ctx, now, event, id) {
        switch (event.event) {
            case "CUSTOMER_ARRIVAL":
                this.drawArrival(ctx);
                break;
            case "CUSTOMER_WAITING":
                this.deskX = event.deskX;
                this.deskY = event.deskY;
                this.currentEventId = id;
                this.drawWaiting(ctx, now);
                break;
            case "WALK_TO_DESK":
                this.deskId = event.deskId;
                this.deskX = event.deskX;
                this.deskY = event.deskY;
                this.currentEventId = id;
                this.drawWalkToDesk(ctx);
                break;
            case "BUY_TICKETS":
                this.deskId = event.deskId;
                this.deskX = event.deskX;
                this.deskY = event.deskY;
                this.currentEventId = id;
                this.drawBuyTickets(ctx, now);
                updateChart(this.deskId);
                break;
            case "CUSTOMER_LEAVES":
                this.currentEventId = id;
                this.drawLeaving(ctx, now);
                break;
        }
    }
    drawArrival(ctx) {
        ctx.drawImage(personIcon, Person.START_AT.x, Person.START_AT.y, IMAGE_WIDTH, IMAGE_HEIGHT);
    }
    drawWalkToDesk(ctx) {
        let destX = this.deskX + 20;
        let destY = this.deskY + 3;
        let startX = Person.START_AT.x;
        let startY = Person.START_AT.y;
        // const prevEvent = this.getPreviousEvent();
        // if (prevEvent && (prevEvent.event == "CUSTOMER_WAITING" || prevEvent.event == "CUSTOMER_LEAVES")) {
        //     startY += 40;
        //     destX = this.deskX; // Изменяем конечные координаты, чтобы начать анимацию с позиции ожидания
        //     destY = this.deskY + 40;
        // }
        const duration = 3000; // Длительность анимации в миллисекундах (5 секунд)
        const currentTime = Date.now() - startTime;
        const progress = Math.min(currentTime / duration, 1);
        const distanceX = destX - startX;
        const distanceY = destY - startY;
        const currentX = startX + distanceX * progress;
        const currentY = startY + distanceY * progress;
        ctx.drawImage(personIcon, currentX, currentY, IMAGE_WIDTH, IMAGE_HEIGHT);
        // Вызываем функцию requestAnimationFrame для повторного вызова drawWalkToDesk до завершения анимации
        if (progress < 1) {
            requestAnimationFrame(() => this.drawWalkToDesk(ctx));
        }
        else {
            walkToDeskDrawn = true;
        }
    }
    drawBuyTickets(ctx, now) {
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
        // const nextEvent = this.getNextEvent();
        // if (nextEvent && nextEvent.event == "CUSTOMER_LEAVES") {
        //     ctx.clearRect(currentX, currentY, IMAGE_WIDTH, IMAGE_HEIGHT);
        // }
        if (progress < 1) {
            requestAnimationFrame(() => this.drawBuyTickets(ctx, now));
        }
    }
    drawWaiting(ctx, now) {
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
        else {
            waitingDrawn = true;
        }
    }
    drawLeaving(ctx, now) {
        const destX = canvas.width - IMAGE_WIDTH; // Правый край холста
        const destY = 0; // Верхний край холста
        if (this.leavingAnimationStartTime === null) {
            // Сохраняем начальные координаты и время старта анимации
            this.leavingAnimationStartTime = Date.now();
            this.leavingAnimationStartX = 300; // Начало анимации слева на краю холста
            this.leavingAnimationStartY = 180 - IMAGE_HEIGHT;
        }
        const duration = 3000; // Длительность анимации в миллисекундах (5 секунд)
        const currentTime = Date.now() - this.leavingAnimationStartTime;
        const progress = Math.min(currentTime / duration, 1);
        const distanceX = destX - this.leavingAnimationStartX;
        const distanceY = destY - this.leavingAnimationStartY;
        const currentX = this.leavingAnimationStartX + distanceX * progress;
        const currentY = this.leavingAnimationStartY + distanceY * progress;
        // Отрисовываем кастомера
        ctx.drawImage(personIcon, currentX, currentY, IMAGE_WIDTH, IMAGE_HEIGHT);
        if (progress < 1) {
            requestAnimationFrame(() => this.drawLeaving(ctx, now));
        }
        else {
            // После завершения анимации можно выполнить какие-либо действия, например, удалить объект из списка активных объектов или выполнить другую логику.
            this.leavingAnimationStartTime = null; // Сбрасываем время старта анимации для последующих вызовов
        }
    }
}
Person.START_AT = { x: 70, y: 700 };
// Глобальная переменная, содержащая массив столов
let globalDesks = [];
let chart;
// Функция для отрисовки графика
const drawChart = (desks) => {
    const canvas = document.getElementById("chart");
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
    chart = new window.Chart(ctx, config);
};
// Функция для обновления данных графика по deskId
const updateChart = (deskId) => {
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
const canvas = document.getElementById("animate");
const Run = (sourceFile, speed) => __awaiter(this, void 0, void 0, function* () {
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("no context?");
        return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const data = (yield (yield fetch(sourceFile)).json());
    const events = SortAndInjectSequentialIDs(data.events);
    const desksData = data.desks;
    const desks = [];
    for (let i = 0; i < desksData.length; i++) {
        const deskData = desksData[i];
        const desk = new Desk(i + 1, deskData.x, deskData.y);
        desks.push(desk);
    }
    globalDesks = desks;
    drawChart(globalDesks);
    const begin = Date.now();
    let processedEvents = [];
    let drawnInitial = false;
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
            if (processedEvents.indexOf(event.id) !== -1)
                return;
            // Если ивент еще не обработан, то выполняем его обработку
            if (event.id !== 0 && event.time <= now) {
                const deskId = event.deskId - 1; // Поправка на индексацию столов, начиная с 0
                if (deskId >= 0 && deskId < desks.length) {
                    const deskData = desksData[deskId];
                    const eventWithCoords = Object.assign(Object.assign({}, event), { deskX: deskData.x, deskY: deskData.y });
                    const newPerson = new Person(event.id, events);
                    newPerson.draw(ctx, now, eventWithCoords, event.id);
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
        else {
            // Создаем кнопку для скачивания отчета
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const downloadReportBtn = document.getElementById("downloadReportBtn");
            downloadReportBtn.style.display = "block";
            downloadReportBtn.addEventListener("click", function () {
                // Укажите путь к файлу отчета здесь
                const reportPath = "report.pdf";
                // Укажите имя файла отчета здесь
                const reportName = "report.pdf";
                // Создаем ссылку для скачивания файла
                const link = document.createElement("a");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                link.href = reportPath;
                link.download = reportName;
                // Добавляем ссылку на страницу и эмулируем клик для начала загрузки файла
                document.body.appendChild(link);
                link.click();
                // Удаляем ссылку после загрузки файла
                document.body.removeChild(link);
            });
        }
    };
    startTime = Date.now();
    Draw();
});
goButton.addEventListener("click", function () {
    const file = "output/events.json";
    const speed = parseInt(document.getElementById("speed").value, 10);
    Run(file, speed);
});
