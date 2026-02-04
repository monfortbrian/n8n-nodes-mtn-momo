import {
  IAuthenticateGeneric,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class MtnMomoApi implements ICredentialType {
  name = 'mtnMomoApi';
  displayName = 'MTN MoMo API';
  documentationUrl = 'https://momodeveloper.mtn.com/';
  properties: INodeProperties[] = [
    {
      displayName: 'Environment',
      name: 'environment',
      type: 'options',
      options: [
        {
          name: 'Sandbox',
          value: 'sandbox',
        },
        {
          name: 'Production',
          value: 'production',
        },
      ],
      default: 'sandbox',
      description: 'The environment to connect to',
    },
    {
      displayName: 'Product',
      name: 'product',
      type: 'options',
      options: [
        {
          name: 'Collections',
          value: 'collection',
        },
        {
          name: 'Disbursements',
          value: 'disbursement',
        },
      ],
      default: 'disbursement',
      description: 'MTN MoMo product to use',
    },
    {
      displayName: 'Subscription Key',
      name: 'subscriptionKey',
      type: 'string',
      default: '',
      required: true,
      typeOptions: {
        password: true,
      },
      description:
        'Primary or Secondary subscription key from MTN MoMo developer portal',
    },
    {
      displayName: 'API User',
      name: 'apiUser',
      type: 'string',
      default: '',
      required: true,
      description: 'API User ID (UUID format)',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      default: '',
      required: true,
      typeOptions: {
        password: true,
      },
      description: 'API Key for authentication',
    },
    {
      displayName: 'Target Environment',
      name: 'targetEnvironment',
      type: 'string',
      default: 'sandbox',
      description: 'Target environment (e.g., sandbox, mtnrwanda, mtnuganda)',
      displayOptions: {
        show: {
          environment: ['production'],
        },
      },
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'Ocp-Apim-Subscription-Key': '={{$credentials.subscriptionKey}}',
      },
    },
  };
}
