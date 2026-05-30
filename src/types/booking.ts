export enum BookingType {
    TIME_SLOT = "TIME_SLOT",
    CAPACITY = "CAPACITY",
    CAPACITY_RECURRENT = "CAPACITY_RECURRENT",
    DATE_RANGE = "DATE_RANGE"
}

export enum BookingStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLE = "CANCELLE" // Correction de la petite faute de frappe sur CANCELLED ;)
}