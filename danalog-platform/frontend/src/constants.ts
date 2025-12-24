export const CUSTOMERS = [
    'QZY',
    'STEINWEG',
    'VẠN TƯỢNG',
    'AST',
    'PHÙNG GIA PHÁT',
    'GEMADEPT-BỘT',
    'HYOSUNG',
    'XIDADONG',
    'Kho hàng DNL',
    'Depot',
    'TRUNG CHUYỂN',
    'Nhiều khách hàng'
] as const;

export const ROUTES_BY_CUSTOMER: Record<string, string[]> = {
    'QZY': [
        'Cảng Tiên Sa - Cửa khẩu quốc tế Lao Bảo - Nhà máy Sunpaper Savannakhet, Lào (2 chiều)',
        'Cảng Tiên Sa - Cửa khẩu quốc tế Lao Bảo - Nhà máy Sunpaper Savannakhet, Lào (1 chiều)'
    ],
    // ... other entries remain the same until the target ...
    'XIDADONG': [
        'Cảng Tiên Sa - KCN Viship Quảng Ngãi'
    ],
    'Nhiều khách hàng': [
        'Cảng Tiên Sa - KCN Thọ Quang'
    ],
    'Kho hàng DNL': [
        'Hàng hóa kho CFS cont 20\'',
        'Hàng hóa kho CFS, cont 40\''
    ],
    'Depot': [
        'cont sửa chữa từ Danalog - Tiên sa và ngược lại'
    ],
    'TRUNG CHUYỂN': [
        'Nội bộ kho bãi Danalog 1',
        'Tàu - Bãi Cảng Tiên Sa'
    ]
};

// Default empty for now, will be populated by user later or derived
export const ROUTE_PRICES: Record<string, number> = {};
