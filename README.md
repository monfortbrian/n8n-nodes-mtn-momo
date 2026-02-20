# n8n-nodes-mtn-momo

![n8n-nodes-mtn-momo](https://img.shields.io/npm/v/n8n-nodes-mtn-momo)
![npm](https://img.shields.io/npm/dt/n8n-nodes-mtn-momo)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

This is an n8n community node for integrating with MTN Mobile Money API.

[n8n](https://n8n.io/) is a workflow automation platform.

## Installation

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-mtn-momo`
4. Agree to risks and install

### Manual Installation

```bash
npm install n8n-nodes-mtn-momo
```

## Operations

### Payment Resource

- **Transfer Money**: Send money to a recipient (Disbursement)
- **Request Payment**: Request payment from a customer (Collection)
- **Get Status**: Check transaction status

### Account Resource

- **Get Balance**: Retrieve account balance
- **Validate Account**: Check if phone number is active

## Credentials

You need the following from [MTN MoMo Developer Portal](https://momodeveloper.mtn.com/):

- **Subscription Key**: Primary or Secondary key
- **API User**: UUID format
- **API Key**: Authentication key
- **Environment**: Sandbox or Production
- **Product**: Collections or Disbursements

## Compatibility

Tested with n8n v2.0.0+

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [MTN MoMo API Documentation](https://momodeveloper.mtn.com/api-documentation)

## License

[MIT](LICENSE.md)
