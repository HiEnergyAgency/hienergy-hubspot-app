import React, { useState } from 'react';
import {
  hubspot,
  Text,
  Flex,
  Alert,
  Button,
  Input
} from '@hubspot/ui-extensions';

const APP_ORIGIN = 'https://app.hienergy.ai';
const API_KEY_DOCS = `${APP_ORIGIN}/api_documentation/api_key`;
const SETTINGS_SAVE_URL = `${APP_ORIGIN}/hubspot/settings`;
const SETTINGS_VALIDATE_URL = `${APP_ORIGIN}/hubspot/settings/validate`;

hubspot.extend(({ context, actions }) => (
  <SettingsPage context={context} addAlert={actions.addAlert} />
));

function SettingsPage({ context, addAlert }) {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState({ loading: false, message: '', variant: null });

  async function handleSave() {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setStatus({
        loading: false,
        message: 'Enter your Hi Energy API key first.',
        variant: 'warning'
      });
      return;
    }

    setStatus({ loading: true, message: '', variant: null });

    try {
      const validation = await hubspot.fetch(SETTINGS_VALIDATE_URL, {
        method: 'POST',
        body: {
          apiKey: trimmed,
          portalId: context?.portal?.id
        }
      });
      const body = validation.ok ? await validation.json() : null;

      if (!body?.ok) {
        setStatus({
          loading: false,
          message: body?.message || 'Hi Energy could not validate this API key.',
          variant: 'warning'
        });
        return;
      }

      try {
        const saveRes = await hubspot.fetch(SETTINGS_SAVE_URL, {
          method: 'POST',
          body: {
            apiKey: trimmed,
            portalId: context?.portal?.id
          }
        });

        if (saveRes.ok) {
          setStatus({
            loading: false,
            message: 'Hi Energy AI is connected for this HubSpot account.',
            variant: 'success'
          });
          addAlert({
            type: 'success',
            title: 'Hi Energy AI connected',
            message: 'Your API key was saved and validated.'
          });
          return;
        }
      } catch {
        // Fall through to validated-but-not-persisted message.
      }

      setStatus({
        loading: false,
        message:
          'API key is valid. Hi Energy must finish portal storage before cards work for all users. Contact support@hienergy.ai if research buttons still fail.',
        variant: 'warning'
      });
    } catch (err) {
      setStatus({
        loading: false,
        message: String(err.message || err),
        variant: 'warning'
      });
    }
  }

  return (
    <Flex direction="column" gap="md">
      <Text>
        Connect Hi Energy AI to HubSpot with your Hi Energy API key. The key is stored
        securely and used server-side for CRM cards and research actions.
      </Text>

      <Text variant="microcopy">
        Get an API key from your Hi Energy account, then paste it below.
      </Text>

      <Input
        name="hienergyApiKey"
        label="Hi Energy API key"
        description="Required for company and contact research in HubSpot."
        type="password"
        value={apiKey}
        onChange={(value) => setApiKey(value)}
      />

      <Button variant="primary" onClick={handleSave} disabled={status.loading}>
        Save and test connection
      </Button>

      {status.message ? (
        <Alert
          title="Hi Energy AI"
          variant={status.variant === 'success' ? 'success' : 'warning'}
        >
          {status.message}
        </Alert>
      ) : null}

      <Button href={{ url: API_KEY_DOCS, external: true }} variant="secondary">
        How to get an API key
      </Button>
    </Flex>
  );
}
