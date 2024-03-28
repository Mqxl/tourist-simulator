import random
import sys
from collections import defaultdict

import numpy as np
import simpy
import json

# Configuration
NUM_DESKS = 4  # Количество столов, где принимают клиентов
NUM_CUSTOMERS = 25  # Количество покупателей
DESK_WORK_TIME = 3  # Время работы одного стола на одного клиента в секундах

if len(sys.argv) > 1:
    # Принимаем аргументы из командной строки
    NUM_DESKS = int(sys.argv[1])
    NUM_CUSTOMERS = int(sys.argv[2])
    DESK_WORK_TIME = int(sys.argv[3])

# Globals for analytics
desk_waits = defaultdict(list)
event_log = []

def avg_wait(raw_waits):
    waits = raw_waits  # raw_waits уже представляет собой список
    return round(np.mean(waits), 1) if len(waits) > 0 else 0

def register_customer_arrival(env, customer_id):
    event_log.append({
        "event": "CUSTOMER_ARRIVAL",
        "time": round(env.now, 2),
        "customerId": customer_id
    })

def register_customer_waiting(env, customer_id, desk_id):
    event_log.append({
        "event": "CUSTOMER_WAITING",
        "time": round(env.now, 2),
        "customerId": customer_id,
        "deskId": desk_id
    })

def register_customer_walk_to_desk(customer_id, desk):
    event_log.append({
        "event": "WALK_TO_DESK",
        "time": round(env.now, 2),
        "customerId": customer_id,
        "deskId": desk
    })

def register_customer_buy_tickets(customer_id, desk):
    event_log.append({
        "event": "BUY_TICKETS",
        "time": round(env.now, 2),
        "customerId": customer_id,
        "deskId": desk
    })

def register_customer_leaves(env, customer_id, desk_id):
    event_log.append({
        "event": "CUSTOMER_LEAVES",
        "time": round(env.now, 2),
        "customerId": customer_id,
        "deskId": desk_id  # Добавляем deskId
    })

def pick_shortest(desks):
    """
    Given a list of SimPy resources (desks), determine the one with the shortest queue.
    Returns the shortest desk (a SimPy resource).
    """
    shortest_desk = desks[0]
    for desk in desks:
        if len(desk.queue) < len(shortest_desk.queue):
            shortest_desk = desk
    return shortest_desk

def customer(env, customer_id, desks):
    register_customer_arrival(env, customer_id)
    desk = pick_shortest(desks)
    desk_id = desks.index(desk) + 1  # Получаем deskId
    walked = False
    with desk.request() as req:
        if len(desk.queue) > 0:  # Если в очереди уже есть клиенты
            register_customer_waiting(env, customer_id, desk_id)
            yield req  # Просто ждем в очереди
        else:  # Если стол свободен
            register_customer_walk_to_desk(customer_id, desk_id)
            walked = True
            yield env.timeout(random.uniform(0.5, 2.0))  # Random walking time
        yield req  # Занимаем стол сразу
        if not walked:
            register_customer_walk_to_desk(customer_id, desk_id)
            yield env.timeout(random.uniform(0.5, 2.0))  # Random walking time


        yield env.timeout(DESK_WORK_TIME)  # Use desk work time for service time

        yield env.timeout(random.uniform(0.5, 2.0))  # Random time between buying tickets and leaving
        register_customer_buy_tickets(customer_id, desk_id)
        register_customer_leaves(env, customer_id, desk_id)  # Передаем deskId

# Simulation
env = simpy.Environment()
desks = [simpy.Resource(env, capacity=1) for _ in range(NUM_DESKS)]

# Generate customers
for i in range(NUM_CUSTOMERS):
    env.process(customer(env, i, desks))

# Run simulation
env.run()

# Output analytics to JSON
with open('output/events.json', 'w') as outfile:
    json.dump({
        "sellerLines": NUM_DESKS,
        "events": event_log,
        "desks": [{"num": i, "x": i * 100, "y": 200} for i in range(NUM_DESKS)]  # Начинаем с 0
    }, outfile)


import json
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph
from reportlab.lib.styles import getSampleStyleSheet

# Load data from file
with open("output/events.json", "r") as file:
    data = json.load(file)

# Initialize variables to store statistics
desk_customers = {desk["num"] + 1: [] for desk in data["desks"]}
desk_service_times = {desk["num"] + 1: [] for desk in data["desks"]}
waiting_times = [0] * data["sellerLines"]

# Process events and collect statistics
for event in data["events"]:
    if event["event"] == "CUSTOMER_ARRIVAL":
        waiting_times.append(event["time"])
    elif event["event"] == "BUY_TICKETS":
        desk_id = event["deskId"]   # Correcting deskId to start from 1
        if desk_id in desk_customers:
            desk_customers[desk_id].append(event["customerId"])
            service_time = event["time"] - waiting_times[event["customerId"]]
            desk_service_times[desk_id].append(service_time)
            waiting_times[event["customerId"]] = None
        else:
            print(f"Error: Event does not contain a valid deskId: {event}")

# Generate report
report = {}
for desk, customers in desk_customers.items():
    if customers:
        report[desk] = {
            "Number of Customers": len(customers),
            "Average Service Time": sum(desk_service_times[desk]) / len(desk_service_times[desk]),
        }
    else:
        report[desk] = {
            "Number of Customers": 0,
            "Average Service Time": 0,
        }

# Create PDF document
pdf_filename = "report.pdf"
doc = SimpleDocTemplate(pdf_filename, pagesize=letter)
styles = getSampleStyleSheet()

# Generate content for PDF report
report_content = []

working_hours_per_day = 8  # Assume 8 working hours per day
working_days_per_month = 20  # Assume 20 working days per month

for desk, stats in report.items():
    if stats["Average Service Time"] > 0:  # Ensure there is service time recorded
        customers_per_hour = 3600 / stats["Average Service Time"]  # Customers served per hour
        customers_per_day = customers_per_hour * working_hours_per_day
        customers_per_month = customers_per_day * working_days_per_month
        report[desk]["Customers Per Day"] = round(customers_per_day, 2)
        report[desk]["Customers Per Month"] = round(customers_per_month, 2)


for desk, stats in report.items():
    report_content.append(Paragraph(f"Desk {desk}", styles['Heading1']))
    for stat, value in stats.items():
        report_content.append(Paragraph(f"{stat}: {value}", styles['Normal']))
    report_content.append(Paragraph("", styles['Normal']))  # Empty line between desks

# Write report to PDF
doc.build(report_content)

print(f"Report saved to file: {pdf_filename}")
