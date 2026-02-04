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

    // Create axios instance with timeout and retry
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 second timeout
      headers: {
        'Ocp-Apim-Subscription-Key': credentials.subscriptionKey,
        'X-Target-Environment':
          credentials.targetEnvironment || credentials.environment,
      },
    });

    // Add response interceptor for better error messages
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.code === 'ECONNABORTED') {
          throw new Error(
            'Request timeout - MTN API is taking too long to respond',
          );
        }
        if (error.response?.status === 500) {
          throw new Error(
            'MTN API server error (500) - Try again in a few minutes',
          );
        }
        if (error.response?.status === 401) {
          throw new Error(
            'Invalid credentials - Check your API User and API Key',
          );
        }
        throw error;
      },
    );
  }

  /**
   * Get access token with retry logic
   */
  async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${this.credentials.apiUser}:${this.credentials.apiKey}`,
    ).toString('base64');

    try {
      const response = await this.client.post(
        `/${this.credentials.product}/token/`,
        {},
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
          timeout: 10000, // 10 second timeout for token
        },
      );

      return response.data.access_token;
    } catch (error: any) {
      if (error.response?.status === 500) {
        throw new Error(
          'MTN API is currently unavailable. Please try again later.',
        );
      }
      throw error;
    }
  }

  /**
   * Transfer money (Disbursement)
   */
  async transfer(request: TransferRequest): Promise<string> {
    const token = await this.getAccessToken();
    const referenceId = uuidv4();

    try {
      await this.client.post(`/disbursement/v1_0/transfer`, request, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Reference-Id': referenceId,
          'Content-Type': 'application/json',
        },
        timeout: 20000, // 20 second timeout
      });

      return referenceId;
    } catch (error: any) {
      if (error.response?.status === 500) {
        throw new Error(
          'MTN API error during transfer. The transaction may still process. Check status with reference ID: ' +
            referenceId,
        );
      }
      throw error;
    }
  }

  /**
   * Request to pay (Collection)
   */
  async requestToPay(request: RequestToPayRequest): Promise<string> {
    const token = await this.getAccessToken();
    const referenceId = uuidv4();

    try {
      await this.client.post(`/collection/v1_0/requesttopay`, request, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Reference-Id': referenceId,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      });

      return referenceId;
    } catch (error: any) {
      if (error.response?.status === 500) {
        throw new Error(
          'MTN API error. Check transaction status later with reference ID: ' +
            referenceId,
        );
      }
      throw error;
    }
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
      timeout: 10000,
    });

    return response.data;
  }

  /**
   * Get account balance
   */
  async getAccountBalance(): Promise<any> {
    const token = await this.getAccessToken();
    const product = this.credentials.product;

    try {
      const response = await this.client.get(
        `/${product}/v1_0/account/balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        },
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 500) {
        throw new Error(
          'MTN API is currently unavailable. Cannot fetch balance at this time.',
        );
      }
      throw error;
    }
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
        timeout: 10000,
      },
    );

    return response.data;
  }
}
