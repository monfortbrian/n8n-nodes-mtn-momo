import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface MtnMomoCredentials {
  environment: 'sandbox' | 'production';
  product: 'collection' | 'disbursement';
  subscriptionKey: string;
  apiUser: string;
  apiKey: string;
  targetEnvironment?: string;
}

export interface TransferRequest {
  amount: string;
  currency: string;
  externalId: string;
  payee: {
    partyIdType: 'MSISDN';
    partyId: string;
  };
  payerMessage?: string;
  payeeNote?: string;
}

export interface RequestToPayRequest {
  amount: string;
  currency: string;
  externalId: string;
  payer: {
    partyIdType: 'MSISDN';
    partyId: string;
  };
  payerMessage?: string;
  payeeNote?: string;
}

export class MtnMomoApiClient {
  private client: AxiosInstance;
  private credentials: MtnMomoCredentials;
  private baseUrl: string;

  constructor(credentials: MtnMomoCredentials) {
    this.credentials = credentials;

    // Set base URL
    if (credentials.environment === 'sandbox') {
      this.baseUrl = 'https://sandbox.momodeveloper.mtn.com';
    } else {
      this.baseUrl = 'https://proxy.momoapi.mtn.com';
    }

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Ocp-Apim-Subscription-Key': credentials.subscriptionKey,
        'X-Target-Environment':
          credentials.targetEnvironment || credentials.environment,
      },
    });
  }

  /**
   * Get access token
   */
  async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${this.credentials.apiUser}:${this.credentials.apiKey}`,
    ).toString('base64');

    const response = await this.client.post(
      `/${this.credentials.product}/token/`,
      {},
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    );

    return response.data.access_token;
  }

  /**
   * Transfer money (Disbursement)
   */
  async transfer(request: TransferRequest): Promise<string> {
    const token = await this.getAccessToken();
    const referenceId = uuidv4();

    await this.client.post(`/disbursement/v1_0/transfer`, request, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Reference-Id': referenceId,
        'Content-Type': 'application/json',
      },
    });

    return referenceId;
  }

  /**
   * Request to pay (Collection)
   */
  async requestToPay(request: RequestToPayRequest): Promise<string> {
    const token = await this.getAccessToken();
    const referenceId = uuidv4();

    await this.client.post(`/collection/v1_0/requesttopay`, request, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Reference-Id': referenceId,
        'Content-Type': 'application/json',
      },
    });

    return referenceId;
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(referenceId: string): Promise<any> {
    const token = await this.getAccessToken();
    const product = this.credentials.product;
    const endpoint =
      product === 'disbursement'
        ? `/disbursement/v1_0/transfer/${referenceId}`
        : `/collection/v1_0/requesttopay/${referenceId}`;

    const response = await this.client.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }

  /**
   * Get account balance
   */
  async getAccountBalance(): Promise<any> {
    const token = await this.getAccessToken();
    const product = this.credentials.product;

    const response = await this.client.get(`/${product}/v1_0/account/balance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }

  /**
   * Validate account holder
   */
  async validateAccountHolder(accountHolderId: string): Promise<any> {
    const token = await this.getAccessToken();
    const product = this.credentials.product;

    const response = await this.client.get(
      `/${product}/v1_0/accountholder/msisdn/${accountHolderId}/active`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  }
}
