export interface PaymentGateway {
    id: number;
    name: string;
    slug: string;
    isActive: boolean;
    config?: any;
    isGlobalFallback: boolean;
}

export interface GatewayCurrencySupport {
    id: number;
    currencyCode: string;
    gatewayId: number;
    isSecondary: boolean;
    isPrimary: boolean;
    gateway?: PaymentGateway;
}

export interface PaymentOptionsResponse {
    currency: string;
    options: {
        id: number;
        name: string;
        slug: string;
        type: 'secondary' | 'FALLBACK';
        isFallback: boolean;
    }[];
}
