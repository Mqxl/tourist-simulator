import random
import time
import json

class TourDesk:
    def __init__(self, num, x, y):
        self.num = num
        self.x = x
        self.y = y
        self.customers = []

    def register_customer(self, customer):
        self.customers.append(customer)

    def remove_customer(self, customer):
        if customer in self.customers:
            self.customers.remove(customer)
        else:
            print(f"Customer {customer} not found in desk {self.num}.")

class Customer:
    def __init__(self, id):
        self.id = id

class TourAgencySimulation:
    def __init__(self, num_desks, num_customers):
        self.desks = [TourDesk(i + 1, 100 * (i + 1), 200) for i in range(num_desks)]
        self.customers = [Customer(i + 1) for i in range(num_customers)]

    def simulate_sale(self):
        for customer in self.customers:
            desk = random.choice(self.desks)
            desk.register_customer(customer)
            time.sleep(0.2)  # Просто для имитации времени продажи
            desk.remove_customer(customer)

    def generate_desks_data(self):
        desks_data = [{"num": desk.num, "x": desk.x, "y": desk.y} for desk in self.desks]
        return desks_data

if __name__ == "__main__":
    num_desks = 10
    num_customers = 200
    simulation = TourAgencySimulation(num_desks, num_customers)
    simulation.simulate_sale()

    with open("data1.json", "r") as file:
        existing_data = json.load(file)

    existing_data["desks"] = simulation.generate_desks_data()

    with open("data1.json", "w") as file:
        json.dump(existing_data, file, indent=4)
