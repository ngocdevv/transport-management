// Sample vehicle tracking data
export const vehicleData = [
    {
      id: 1,
      name: "Truck 01",
      type: "Delivery",
      color: "#1E88E5",
      routes: [
        {
          timestamp: "2025-05-15T08:00:00",
          longitude: 106.6297,
          latitude: 10.8231,
          speed: 35
        },
        {
          timestamp: "2025-05-15T08:15:00",
          longitude: 106.6350,
          latitude: 10.8240,
          speed: 40
        },
        {
          timestamp: "2025-05-15T08:30:00",
          longitude: 106.6400,
          latitude: 10.8260,
          speed: 30
        },
        {
          timestamp: "2025-05-15T08:45:00",
          longitude: 106.6450,
          latitude: 10.8270,
          speed: 25
        },
        {
          timestamp: "2025-05-15T09:00:00",
          longitude: 106.6500,
          latitude: 10.8290,
          speed: 0
        }
      ]
    },
    {
      id: 2,
      name: "Van 02",
      type: "Service",
      color: "#43A047",
      routes: [
        {
          timestamp: "2025-05-15T08:00:00",
          longitude: 106.6500,
          latitude: 10.7500,
          speed: 45
        },
        {
          timestamp: "2025-05-15T08:20:00",
          longitude: 106.6450,
          latitude: 10.7600,
          speed: 40
        },
        {
          timestamp: "2025-05-15T08:40:00",
          longitude: 106.6400,
          latitude: 10.7700,
          speed: 30
        },
        {
          timestamp: "2025-05-15T09:00:00",
          longitude: 106.6350,
          latitude: 10.7800,
          speed: 0
        }
      ]
    },
    {
      id: 3,
      name: "Car 03",
      type: "Sedan",
      color: "#E53935",
      routes: [
        {
          timestamp: "2025-05-15T08:30:00",
          longitude: 106.7000,
          latitude: 10.8000,
          speed: 50
        },
        {
          timestamp: "2025-05-15T08:45:00",
          longitude: 106.6900,
          latitude: 10.8100,
          speed: 45
        },
        {
          timestamp: "2025-05-15T09:00:00",
          longitude: 106.6800,
          latitude: 10.8200,
          speed: 0
        }
      ]
    }
  ];
  
  // Store the data in localStorage (client-side only)
  export const initializeLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const storedVehicles = localStorage.getItem('vehicles');
      if (!storedVehicles) {
        localStorage.setItem('vehicles', JSON.stringify(vehicleData));
      }
    }
  };
  
  // Get vehicles from localStorage
  export const getVehicles = () => {
    if (typeof window !== 'undefined') {
      const storedVehicles = localStorage.getItem('vehicles');
      return storedVehicles ? JSON.parse(storedVehicles) : [];
    }
    return [];
  };
  
  // Save vehicles to localStorage
  export const saveVehicles = (vehicles: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vehicles', JSON.stringify(vehicles));
    }
  };
  
  // Add a new vehicle
  export const addVehicle = (vehicle: any) => {
    const vehicles = getVehicles();
    const newVehicle = {
      ...vehicle,
      id: vehicles.length > 0 ? Math.max(...vehicles.map((v: { id: any; }) => v.id)) + 1 : 1
    };
    vehicles.push(newVehicle);
    saveVehicles(vehicles);
    return newVehicle;
  };
  
  // Update a vehicle
  export const updateVehicle = (updatedVehicle: { id: any; }) => {
    const vehicles = getVehicles();
    const index = vehicles.findIndex((v: { id: any; }) => v.id === updatedVehicle.id);
    if (index !== -1) {
      vehicles[index] = updatedVehicle;
      saveVehicles(vehicles);
      return true;
    }
    return false;
  };
  
  // Delete a vehicle
  export const deleteVehicle = (id: any) => {
    const vehicles = getVehicles();
    const filteredVehicles = vehicles.filter((v: { id: any; }) => v.id !== id);
    if (filteredVehicles.length !== vehicles.length) {
      saveVehicles(filteredVehicles);
      return true;
    }
    return false;
  };