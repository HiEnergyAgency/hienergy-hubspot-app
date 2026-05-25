import React, { useEffect, useState } from 'react';
import {
  hubspot,
  Text,
  Flex,
  Divider,
  LoadingSpinner,
  Alert,
  Button
} from '@hubspot/ui-extensions';
import {
  APP_ORIGIN,
  getContactSearchQuery,
  researchContact
} from './lib/companyResearch';
import { ResearchSections } from './lib/ResearchResults';

hubspot.extend(({ context }) => <ContactCard context={context} />);

function ContactCard({ context }) {
  const props = context?.crm?.object?.properties || {};
  const { domain, query, email } = getContactSearchQuery(props);

  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!query) {
        setState({
          loading: false,
          data: null,
          error: 'Add an email or company to search Hi Energy AI.'
        });
        return;
      }

      setState({ loading: true, data: null, error: null });

      try {
        const result = await researchContact(props, context?.portal?.id);

        if (cancelled) return;
        if (!result.ok) {
          setState({
            loading: false,
            data: null,
            error: result.message
          });
          return;
        }
        setState({ loading: false, data: result, error: null });
      } catch (err) {
        if (!cancelled) {
          setState({ loading: false, data: null, error: String(err.message || err) });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [query, domain, email, props, context?.portal?.id]);

  if (state.loading) {
    return <LoadingSpinner label="Searching Hi Energy AI…" />;
  }

  if (state.error) {
    return (
      <Flex direction="column" gap="md">
        <Alert title="Hi Energy AI" variant="warning">
          {state.error}
        </Alert>
        <Button href={{ url: `${APP_ORIGIN}/api_documentation/api_key`, external: true }}>
          Get Hi Energy API key
        </Button>
      </Flex>
    );
  }

  const sections = state.data?.sections || [];

  return (
    <Flex direction="column" gap="sm">
      <Text variant="microcopy">
        {email ? `Email domain: ${domain || '—'}` : `Search: ${query}`}
      </Text>
      <ResearchSections
        sections={sections}
        emptyMessage="No Hi Energy matches for this contact."
      />
      <Divider />
      <Button href={APP_ORIGIN}>Open Hi Energy AI</Button>
    </Flex>
  );
}
