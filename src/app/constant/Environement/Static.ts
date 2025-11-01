export enum RolesEnum {
    CLIENT = 'CLIENT',
    ADMIN = 'ADMIN',
    DRIVER = 'DRIVER',
}

export enum StepEnum {
    FILLING = 'FILLING',
    DELIVERING = 'DELIVERING'
}

export enum DataKey {
    isFirstTime = 'isFirstTime',
    isSkipped = 'isSkipped',
    token = 'token',
    refreshToken = 'refreshToken',
    accessTokenExpiry = 'accessTokenExpiry',
    refreshTokenExpiry = 'refreshTokenExpiry',
    currentLang = 'currentLang',
    cart = 'cart',
    basket = 'basket',
    rememberedUser = 'rememberedUser',
    tmpPass = 'tmpPass',
    deviceId = 'deviceId',
}


export enum LangEnum {
    fr_FR = 'fr-FR',
    en_EN = 'en-EN',
    ar_AR = 'ar-AR',
    ur_UR = 'ur-UR',
}

export enum OrderStatusEnum {
    WAITING = 'WAITING',
    PICKED_UP = 'PICKED_UP',
    ACCEPTED = 'ACCEPTED',
    CANCELED = 'CANCELED',
    DELIVERED = 'DELIVERED',
    PENDING = 'PENDING',
    INCOMPLETE = 'INCOMPLETE',
    BASKET = 'BASKET',
    REFUSED = 'REFUSED',
    READY_TO_PICKUP = 'READY_TO_PICKUP'
}

export enum DeliveryStatus {
    WAITING = 'WAITING',
    IN_PROGRESS = 'IN_PROGRESS',
    ACCEPTED = 'ACCEPTED',
    CANCELED = 'CANCELED',
    DELIVERED = 'DELIVERED',
}


export enum AvailabilityEnum {
    AVAILABLE = 'AVAILABLE',
    UNAVAILABLE = 'UNAVAILABLE'
}

export const OrderTankerStatusList = [
    {
        name: OrderStatusEnum.WAITING
    },
    {
        name: OrderStatusEnum.ACCEPTED
    },
    {
        name: OrderStatusEnum.DELIVERED
    },
    {
        name: OrderStatusEnum.CANCELED
    },
]

export const telRegex = /^\d{8}$/gm;

export const civilities = [
    {
        name: 'Mr',
    },
    {
        name: 'Mrs',
    }
]

export enum GenderEnum {
    MALE = 'MALE',
    FEMALE = 'FEMALE'
}

export const genders = [
    {
        name: 'Male',
        value: GenderEnum.MALE
    },
    {
        name: 'Female',
        value: GenderEnum.FEMALE
    }
]

export const transactionTypes = [
    {
        name: 'All',
    },
    {
        name: 'Credit',
    },
    {
        name: 'Debit',
    }
]

export const suppors = [
    {
        name: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. 1',
    },
    {
        name: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. 2',
    },
    {
        name: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. 3',
    }
]

export const addresses = [
    {
        id: 1,
        name: 'Sheikh Khalifa Bin Saeed Street Dubai.',
        isDefault: false,
        latitude: '25.276987',
        longitude: '55.296249',
    },
    {
        id: 2,
        name: 'Sheikh Khalifa Bin Saeed Street Dubai. 5612',
        isDefault: true,
        latitude: '25.276987',
        longitude: '55.296249',
    },
    {
        id: 3,
        name: 'Sheikh Khalifa Bin Saeed Street Dubai. 5612',
        isDefault: true,
        latitude: '25.276987',
        longitude: '55.296249',
    },
    {
        id: 4,
        name: 'Sheikh Khalifa Bin Saeed Street Dubai. 5612',
        isDefault: true,
        latitude: '25.276987',
        longitude: '55.296249',
    },
    {
        id: 5,
        name: 'Sheikh Khalifa Bin Saeed Street Dubai. 5612',
        isDefault: true,
        latitude: '25.276987',
        longitude: '55.296249',
    }
]

export enum CardType {
    VISA = 'VISA',
    PAYPAL = 'PAYPAL',
    APPLE = 'APPLE'
}

export enum PaymentMethodEnum {
    CARD = 'CARD',
    CASH = 'CASH',
    WALLET = 'WALLET',
    WALLET_CASH = 'WALLET_CASH',
    WALLET_CARD = 'WALLET_CARD',
    VOUCHER ='VOUCHER',
    VOUCHER_CARD ='VOUCHER_CARD',
    VOUCHER_CASH ='VOUCHER_CASH',
    VOUCHER_WALLET ='VOUCHER_WALLET',
    VOUCHER_WALLET_CARD ='VOUCHER_WALLET_CARD',
    VOUCHER_WALLET_CASH ='VOUCHER_WALLET_CASH',
    MIXED = 'MIXED'
}

export enum OperationLineStatusEnum {
    WAITING = 'WAITING',
    PROCESSED = 'PROCESSED',
    CANCELED = 'CANCELED',
    CONFIRMED = 'CONFIRMED',
}

export enum TransactionStatusEnum {
    SUCCEEDED = 'SUCCEEDED ',
    INCOMPLETE = 'INCOMPLETE ',
    FAILED = 'FAILED ',
    CANCELED = 'CANCELED ',
    REFUNDED = 'REFUNDED ',
}

export interface IDistDur {
    distance: number,
    duration: number
}

export enum TankerModelTypeEnum {
    WATER = 'WATER',
    JET = 'JET',
    TRANSPORT = 'TRANSPORT',
    SERVICE = 'SERVICE'
}

export enum FeeTypeEnum {
    CLASSIC = 'CLASSIC',
    CUSTOM = 'CUSTOM'
}

export enum SourceFeeEnum {
    UNIT_COST = 'UNIT_COST',
    MARGE = 'MARGE',
    SALE_PRICE = 'SALE_PRICE'
}

export enum OperationLineTypeEnum {
    IN = 'IN',
    OUT = 'OUT',
}

export enum NotificationTypeEnum {
    AVAILABLE_ORDER = 'AVAILABLE_ORDER',
    DISMISS_ORDER = 'DISMISS_ORDER',
    TANKER_ORDER = 'TANKER_ORDER',
    CHAT = 'CHAT',
    TANKER_ORDER_UPDATE = 'TANKER_ORDER_UPDATE',
    WALLET_PAYMENT_UPDATE = 'WALLET_PAYMENT_UPDATE',
    BREAK_UPDATE = 'BREAK_UPDATE',
    SCHEDULED_ORDER = 'SCHEDULED_ORDER',
    INFORMATION = 'INFORMATION',
    ACCOUNT_ACTIVATION = 'ACCOUNT_ACTIVATION',
    CHAT_BO = 'CHAT_BO',
    CHAT_SUPPORT = 'CHAT_SUPPORT'
}

export enum zoneTypeEnum {
    RANCH = 'RANCH',
    CITY = 'CITY',
    FARM = 'FARM',
    STATION = 'STATION',
    VILLA = 'VILLA',
    APPT = 'APPT'
}

export enum wheelDriveEnum {
    _4WD = '_4WD',
    _2WD = '_2WD',
}

export enum VoucherStatusEnum {
    VALID = 'VALID',
    USED = 'USED',
    EXPIRED = 'EXPIRED'
}

export enum MotifEnum {
    RECLAMATION = 'RECLAMATION',
    OTHER = 'OTHER',
    CANCELED_ORDER = 'OTHER',
    REJECTED_ORDER = 'OTHER'
}

export enum VehicleType {
    MOTORBIKE_DRIVER = 'MOTORBIKE_DRIVER',
    MOTOR_DRIVER = ' MOTOR_DRIVER',
    CAR_DRIVER = 'CAR_DRIVER',
    TRUCK_DRIVER = 'TRUCK_DRIVER',
}

export enum MediaEnum {
    LOGO ="media_logo",
    IMAGE = "media_image",
    CATEGORY = "media_category",
    PRODUCT = "media_product",
    ITEM = "media_item",
    CONFIG = "media_config",
    TANKER = "media_tanker",
    ENTERPRISE = "media_enterprise",
    VEHICLE = "media_vehicle",
    IDENTITY = "media_identity",
    RESTAURANT = "restaurant_medias",
}

export enum MatchMode {
    startsWith,
    contains,
    notContains,
    endsWith,
    equals,
    notEquals,
    in,
    gt,
    lt,
    dateIs = "dateIs",
    dateAfter= "dateAfter",
    dateBefore= "dateBefor",
}


