import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

import { MtnMomoApiClient, MtnMomoCredentials } from '../../utils/MtnMomoApi';

export class MtnMomo implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MTN MoMo',
    name: 'mtnMomo',
    icon: 'file:mtnmomo.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with MTN Mobile Money API',
    defaults: {
      name: 'MTN MoMo',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'mtnMomoApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Payment',
            value: 'payment',
          },
          {
            name: 'Account',
            value: 'account',
          },
        ],
        default: 'payment',
      },
      // Payment Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['payment'],
          },
        },
        options: [
          {
            name: 'Transfer Money',
            value: 'transfer',
            description: 'Send money to a recipient (Disbursement)',
            action: 'Transfer money',
          },
          {
            name: 'Request Payment',
            value: 'requestToPay',
            description: 'Request payment from a customer (Collection)',
            action: 'Request payment',
          },
          {
            name: 'Get Status',
            value: 'getStatus',
            description: 'Get transaction status',
            action: 'Get transaction status',
          },
        ],
        default: 'transfer',
      },
      // Account Operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['account'],
          },
        },
        options: [
          {
            name: 'Get Balance',
            value: 'getBalance',
            description: 'Get account balance',
            action: 'Get account balance',
          },
          {
            name: 'Validate Account',
            value: 'validateAccount',
            description: 'Check if account holder is active',
            action: 'Validate account holder',
          },
        ],
        default: 'getBalance',
      },
      // Transfer Fields
      {
        displayName: 'Phone Number',
        name: 'phoneNumber',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['payment'],
            operation: ['transfer', 'requestToPay'],
          },
        },
        description: 'Recipient phone number (format: 250788123456)',
      },
      {
        displayName: 'Amount',
        name: 'amount',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['payment'],
            operation: ['transfer', 'requestToPay'],
          },
        },
        description: 'Amount to send',
      },
      {
        displayName: 'Currency',
        name: 'currency',
        type: 'string',
        default: 'RWF',
        required: true,
        displayOptions: {
          show: {
            resource: ['payment'],
            operation: ['transfer', 'requestToPay'],
          },
        },
        description: 'Currency code (e.g., RWF, UGX, XAF)',
      },
      {
        displayName: 'External ID',
        name: 'externalId',
        type: 'string',
        default: '={{$now.toMillis()}}',
        displayOptions: {
          show: {
            resource: ['payment'],
            operation: ['transfer', 'requestToPay'],
          },
        },
        description: 'Your internal transaction ID',
      },
      {
        displayName: 'Payer Message',
        name: 'payerMessage',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['payment'],
            operation: ['transfer', 'requestToPay'],
          },
        },
        description: 'Message for the payer',
      },
      {
        displayName: 'Payee Note',
        name: 'payeeNote',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['payment'],
            operation: ['transfer', 'requestToPay'],
          },
        },
        description: 'Note for the payee',
      },
      // Get Status Fields
      {
        displayName: 'Reference ID',
        name: 'referenceId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['payment'],
            operation: ['getStatus'],
          },
        },
        description: 'Transaction reference ID to check',
      },
      // Validate Account Fields
      {
        displayName: 'Phone Number',
        name: 'phoneNumber',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['account'],
            operation: ['validateAccount'],
          },
        },
        description: 'Phone number to validate',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0);
    const operation = this.getNodeParameter('operation', 0);

    // Get credentials
    const credentials = (await this.getCredentials(
      'mtnMomoApi',
    )) as MtnMomoCredentials;
    const client = new MtnMomoApiClient(credentials);

    for (let i = 0; i < items.length; i++) {
      try {
        if (resource === 'payment') {
          if (operation === 'transfer') {
            // Transfer money
            const phoneNumber = this.getNodeParameter(
              'phoneNumber',
              i,
            ) as string;
            const amount = this.getNodeParameter('amount', i) as string;
            const currency = this.getNodeParameter('currency', i) as string;
            const externalId = this.getNodeParameter('externalId', i) as string;
            const payerMessage = this.getNodeParameter(
              'payerMessage',
              i,
              '',
            ) as string;
            const payeeNote = this.getNodeParameter(
              'payeeNote',
              i,
              '',
            ) as string;

            const referenceId = await client.transfer({
              amount,
              currency,
              externalId,
              payee: {
                partyIdType: 'MSISDN',
                partyId: phoneNumber,
              },
              payerMessage,
              payeeNote,
            });

            returnData.push({
              json: {
                success: true,
                referenceId,
                amount,
                currency,
                phoneNumber,
                externalId,
              },
              pairedItem: { item: i },
            });
          } else if (operation === 'requestToPay') {
            // Request payment
            const phoneNumber = this.getNodeParameter(
              'phoneNumber',
              i,
            ) as string;
            const amount = this.getNodeParameter('amount', i) as string;
            const currency = this.getNodeParameter('currency', i) as string;
            const externalId = this.getNodeParameter('externalId', i) as string;
            const payerMessage = this.getNodeParameter(
              'payerMessage',
              i,
              '',
            ) as string;
            const payeeNote = this.getNodeParameter(
              'payeeNote',
              i,
              '',
            ) as string;

            const referenceId = await client.requestToPay({
              amount,
              currency,
              externalId,
              payer: {
                partyIdType: 'MSISDN',
                partyId: phoneNumber,
              },
              payerMessage,
              payeeNote,
            });

            returnData.push({
              json: {
                success: true,
                referenceId,
                amount,
                currency,
                phoneNumber,
                externalId,
              },
              pairedItem: { item: i },
            });
          } else if (operation === 'getStatus') {
            // Get transaction status
            const referenceId = this.getNodeParameter(
              'referenceId',
              i,
            ) as string;
            const status = await client.getTransactionStatus(referenceId);

            returnData.push({
              json: status,
              pairedItem: { item: i },
            });
          }
        } else if (resource === 'account') {
          if (operation === 'getBalance') {
            // Get balance
            const balance = await client.getAccountBalance();

            returnData.push({
              json: balance,
              pairedItem: { item: i },
            });
          } else if (operation === 'validateAccount') {
            // Validate account
            const phoneNumber = this.getNodeParameter(
              'phoneNumber',
              i,
            ) as string;
            const validation = await client.validateAccountHolder(phoneNumber);

            returnData.push({
              json: {
                phoneNumber,
                isActive: validation.result === true,
                ...validation,
              },
              pairedItem: { item: i },
            });
          }
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error instanceof Error ? error.message : String(error),
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw new NodeOperationError(
          this.getNode(),
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }

    return [returnData];
  }
}
