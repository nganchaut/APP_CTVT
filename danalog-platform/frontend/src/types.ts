import { LEGACY_TICKETS } from './legacy_tickets';

export type TrafficStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';

export interface TransportTicket {
    id: string;
    stt: number;
    dateStart: string;
    dateEnd: string;
    licensePlate: string;
    driverName?: string; // Driver Name
    createdBy?: string; // Username of the creator
    customerCode: string; // e.g., SAM, LG
    containerNo: string;
    route: string;
    routeId?: string; // Reference to RouteConfig
    size: '20' | '40' | '40R0' | '45' | 'other';
    fe: 'F' | 'E'; // Full / Empty
    trips: number;
    imageUrl?: string;
    containerImage?: string; // Driver app uses this

    // Computed/Estimated values
    revenue: number;
    driverSalary: number;
    driverPrice?: number; // Don gia luong tai xe

    status: TrafficStatus;

    // Blockchain metadata
    onChainHash?: string;
    onChainStatus?: 'NONE' | 'PENDING' | 'VERIFIED';

    // Extra fields for logic
    nightStay?: boolean; // Luu dem
    nightStayDays?: number; // So luong dem luu
    nightStayLocation?: 'INNER_CITY' | 'OUTER_CITY' | 'OUT_CITY' | 'IN_CITY';
    notes?: string;

    // Detailed Edit Fields
    weight?: number;
    cityStatus?: 'OUT_CITY' | 'IN_CITY';
    oilIncluded?: boolean;

    // Fees
    liftOnFee?: number; // Nang full
    liftOffFee?: number; // Ha rong
    airportFee?: number; // Phi lay hang san bay

    statusHistory?: {
        status: string;
        timestamp: string;
        user: string;
        action: string;
    }[];
}

export interface RouteConfig {
    id: string;
    routeName: string;
    customer: string;

    // Dynamic Fields
    cargoType: 'TR_C_NOI_BO' | 'TR_C_CHUYEN_GIAY' | 'KHO_CFS_40' | 'KHO_CFS_20' | 'VC_GIAY' | 'VC_BOT' | 'VC_CONT' | 'LUU_DEM';
    isNightStay: boolean;
    nightStayLocation?: 'INNER_CITY' | 'OUTER_CITY';

    revenue: {
        price40F: number;
        price40E: number;
        price20F: number;
        price20E: number;

        liftDescFee: number;
    };

    salary: {
        driverSalary: number;
        surcharge: number;
    };

    fuel: {
        truckType: 'TRACTOR' | 'TRUCK';
        quota: number; // Liters
        gasStations: string[];
    };

    effectiveDate: string;
    status: 'ACTIVE' | 'INACTIVE';
}

// Mock Data
export const MOCK_ROUTES_CONFIG: RouteConfig[] = [
    // QZY
    {
        id: 'RT-QZY-01',
        routeName: 'Cảng Tiên Sa - Cửa khẩu quốc tế Lao Bảo - Nhà máy Sunpaper Savannakhet, Lào (2 chiều)',
        customer: 'QZY',
        cargoType: 'VC_CONT',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRACTOR', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    {
        id: 'RT-QZY-02',
        routeName: 'Cảng Tiên Sa - Cửa khẩu quốc tế Lao Bảo - Nhà máy Sunpaper Savannakhet, Lào (1 chiều)',
        customer: 'QZY',
        cargoType: 'VC_CONT',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRACTOR', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    // STEINWEG
    {
        id: 'RT-STEINWEG-01',
        routeName: 'Cảng Tiên Sa, Danang - Vientiane, Lào.',
        customer: 'STEINWEG',
        cargoType: 'VC_CONT',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRACTOR', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    // VAN TUONG
    {
        id: 'RT-VANTUONG-01',
        routeName: 'Salavan, Lào quá cảnh qua CK Lalay đến cảng Tiên Sa, Đà Nẵng (bốc container rỗng sang đóng hàng)',
        customer: 'VẠN TƯỢNG',
        cargoType: 'VC_CONT',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRACTOR', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    // AST
    {
        id: 'RT-AST-01',
        routeName: 'Cảng Tiên Sa, Đà Nẵng - Champasak, Lào',
        customer: 'AST',
        cargoType: 'VC_CONT',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRACTOR', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    // PHUNG GIA PHAT
    {
        id: 'RT-PGP-01',
        routeName: 'NM Tinh bột sắn, Sepon Lào - Cảng Tiên Sa Đà Nẵng (bốc container rỗng sang đóng hàng)',
        customer: 'PHÙNG GIA PHÁT',
        cargoType: 'VC_BOT',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRACTOR', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    // GEMADEPT-BOT
    {
        id: 'RT-GEMADEPT-01',
        routeName: 'NM Tinh bột sắn, Sepon Lào - Cảng Tiên Sa Đà Nẵng (bốc container rỗng sang đóng hàng)',
        customer: 'GEMADEPT-BỘT',
        cargoType: 'VC_BOT',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRACTOR', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    // HYOSUNG
    {
        id: 'RT-HYOSUNG-01',
        routeName: 'Cảng Tiên Sa, Đà Nẵng- HS Hyosung Quảng Nam, KCN Tam Thăng, xã Thăng Trường, thành phố Đà Nẵng',
        customer: 'HYOSUNG',
        cargoType: 'VC_CONT',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRACTOR', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    {
        id: 'RT-HYOSUNG-02',
        routeName: 'Cảng Tiên Sa, Đà Nẵng- HS Hyosung Quảng Nam, KCN Tam Thăng, xã Thăng Trường, thành phố Đà Nẵng (2 chuyến/ngày)',
        customer: 'HYOSUNG',
        cargoType: 'VC_CONT',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRACTOR', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    // XIDADONG
    {
        id: 'RT-XIDADONG-01',
        routeName: 'Cảng Tiên Sa - KCN Viship Quảng Ngãi',
        customer: 'XIDADONG',
        cargoType: 'VC_CONT',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRACTOR', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    // NHIEU KHACH HANG
    {
        id: 'RT-OTHER-01',
        routeName: 'Cảng Tiên Sa - KCN Thọ Quang',
        customer: 'Nhiều khách hàng',
        cargoType: 'VC_CONT',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRACTOR', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    // INTERNAL - KHO HANG DNL
    {
        id: 'RT-DNL-01',
        routeName: 'Hàng hóa kho CFS cont 20\'',
        customer: 'Kho hàng DNL',
        cargoType: 'KHO_CFS_20',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRUCK', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    {
        id: 'RT-DNL-02',
        routeName: 'Hàng hóa kho CFS, cont 40\'',
        customer: 'Kho hàng DNL',
        cargoType: 'KHO_CFS_40',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRUCK', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    // DEPOT
    {
        id: 'RT-DEPOT-01',
        routeName: 'cont sửa chữa từ Danalog - Tiên sa và ngược lại',
        customer: 'Depot',
        cargoType: 'VC_CONT',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRACTOR', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    // TRUNG CHUYEN
    {
        id: 'RT-TC-01',
        routeName: 'Nội bộ kho bãi Danalog 1',
        customer: 'TRUNG CHUYỂN',
        cargoType: 'TR_C_NOI_BO',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRUCK', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    {
        id: 'RT-TC-02',
        routeName: 'Tàu - Bãi Cảng Tiên Sa',
        customer: 'TRUNG CHUYỂN',
        cargoType: 'TR_C_NOI_BO',
        isNightStay: false,
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 },
        fuel: { truckType: 'TRUCK', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    // Default Overnight Stay Configs
    {
        id: 'RT-NIGHT-01',
        routeName: 'Lưu đêm (Ngoài TP)',
        customer: 'DEFAULT',
        cargoType: 'LUU_DEM',
        isNightStay: true,
        nightStayLocation: 'OUTER_CITY',
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 }, // 0 for Driver
        fuel: { truckType: 'TRUCK', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    },
    {
        id: 'RT-NIGHT-02',
        routeName: 'Lưu đêm (Trong TP)',
        customer: 'DEFAULT',
        cargoType: 'LUU_DEM',
        isNightStay: true,
        nightStayLocation: 'INNER_CITY',
        revenue: { price40F: 0, price40E: 0, price20F: 0, price20E: 0, liftDescFee: 0 },
        salary: { driverSalary: 0, surcharge: 0 }, // 0 for Driver
        fuel: { truckType: 'TRUCK', quota: 0, gasStations: [] },
        effectiveDate: '2023-01-01',
        status: 'ACTIVE'
    }
];

export const MOCK_TICKETS: TransportTicket[] = [
    {
        id: 'T-001',
        stt: 1,
        dateStart: '2025-12-20',
        dateEnd: '2025-12-21',
        licensePlate: '43C-199.91',
        driverName: 'Nguyễn Đức Tiên',
        createdBy: 'tiennd',
        customerCode: 'HYOSUNG',
        containerNo: 'OOLU1234567',
        route: 'Cảng Tiên Sa, Đà Nẵng- HS Hyosung Quảng Nam',
        size: '40',
        fe: 'F',
        trips: 1,
        revenue: 0,
        driverSalary: 0,
        status: 'APPROVED',
        nightStay: false,
        statusHistory: [
            { status: 'APPROVED', timestamp: '08:30 20/12/2025', user: 'admin', action: 'Phê duyệt phiếu' },
            { status: 'PENDING', timestamp: '08:00 20/12/2025', user: 'tiennd', action: 'Khởi tạo phiếu' }
        ]
    },
    {
        id: 'T-002',
        stt: 2,
        dateStart: '2025-12-21',
        dateEnd: '2025-12-22',
        licensePlate: '43C-199.91',
        driverName: 'Nguyễn Đức Tiên',
        createdBy: 'tiennd',
        customerCode: 'QZY',
        containerNo: 'SUDU9876543',
        route: 'Cảng Tiên Sa - Cửa khẩu quốc tế Lao Bảo',
        size: '40',
        fe: 'E',
        trips: 1,
        revenue: 0,
        driverSalary: 0,
        status: 'APPROVED',
        nightStay: true,
        nightStayDays: 1,
        statusHistory: [
            { status: 'APPROVED', timestamp: '10:30 21/12/2025', user: 'admin', action: 'Phê duyệt phiếu' },
            { status: 'PENDING', timestamp: '09:30 21/12/2025', user: 'tiennd', action: 'Khởi tạo phiếu' }
        ]
    },
    {
        id: 'T-003',
        stt: 3,
        dateStart: '2025-12-22',
        dateEnd: '2025-12-22',
        licensePlate: '43C-199.91',
        driverName: 'Nguyễn Văn Anh',
        createdBy: 'anhnv',
        customerCode: 'AST',
        containerNo: 'TRKU1112223',
        route: 'Cảng Tiên Sa, Đà Nẵng - Champasak, Lào',
        size: '20',
        fe: 'F',
        trips: 1,
        revenue: 0,
        driverSalary: 0,
        status: 'APPROVED',
        nightStay: false,
        statusHistory: [
            { status: 'APPROVED', timestamp: '11:30 22/12/2025', user: 'admin', action: 'Phê duyệt phiếu' },
            { status: 'PENDING', timestamp: '07:00 22/12/2025', user: 'anhnv', action: 'Khởi tạo phiếu' }
        ]
    },
    {
        id: 'T-004',
        stt: 4,
        dateStart: '2025-12-23',
        dateEnd: '2025-12-23',
        licensePlate: '43C-199.91',
        driverName: 'Nguyễn Đức Tiên',
        createdBy: 'tiennd',
        customerCode: 'HYOSUNG',
        containerNo: 'OOLU8889991',
        route: 'Cảng Tiên Sa, Đà Nẵng- HS Hyosung Quảng Nam',
        size: '40',
        fe: 'E',
        trips: 1,
        revenue: 0,
        driverSalary: 0,
        status: 'PENDING',
        nightStay: false,
        statusHistory: [
            { status: 'PENDING', timestamp: '06:00 23/12/2025', user: 'tiennd', action: 'Khởi tạo phiếu' }
        ]
    },
    {
        id: 'T-005',
        stt: 5,
        dateStart: '2025-12-24',
        dateEnd: '2025-12-24',
        licensePlate: '43C-222.33',
        driverName: 'Nguyễn Đức Tiên',
        createdBy: 'tiennd',
        customerCode: 'STEINWEG',
        containerNo: 'SUDU7776665',
        route: 'Cảng Tiên Sa, Danang - Vientiane, Lào.',
        size: '20',
        fe: 'F',
        trips: 1,
        revenue: 0,
        driverSalary: 0,
        status: 'DRAFT',
        nightStay: true,
        nightStayDays: 2,
        statusHistory: [
            { status: 'DRAFT', timestamp: '08:00 24/12/2025', user: 'tiennd', action: 'Lưu nháp' }
        ]
    },
    {
        id: 'T-006',
        stt: 6,
        dateStart: '2025-12-25',
        dateEnd: '2025-12-26',
        licensePlate: '43C-444.55',
        driverName: 'Nguyễn Văn Thành',
        createdBy: 'thanhnv',
        customerCode: 'XIDADONG',
        containerNo: 'TRKU4445556',
        route: 'Cảng Tiên Sa - KCN Viship Quảng Ngãi',
        size: '20',
        fe: 'F',
        trips: 1,
        revenue: 0,
        driverSalary: 0,
        status: 'PENDING',
        nightStay: true,
        nightStayDays: 1,
        statusHistory: [
            { status: 'PENDING', timestamp: '07:30 25/12/2025', user: 'thanhnv', action: 'Khởi tạo phiếu' }
        ]
    },
    ...LEGACY_TICKETS
];
