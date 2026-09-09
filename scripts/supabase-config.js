window.URBAN_STAY_SUPABASE = {
  url: 'https://wojfialcbjkviwyjiaqa.supabase.co',
  publishableKey: 'sb_publishable_6k6j4ErA5GBuPGFbybz87g_Ez61SYJT'
};

(() => {
  'use strict';

  if (!window.supabase?.createClient || !window.URBAN_STAY_SUPABASE) return;

  const originalCreateClient = window.supabase.createClient.bind(window.supabase);
  const cfg = window.URBAN_STAY_SUPABASE;

  function showLoginStatus(text, isError = false) {
    window.setTimeout(() => {
      const loginMessage = document.querySelector('#loginMessage');
      if (loginMessage) {
        loginMessage.textContent = text;
        loginMessage.className = 'form-message' + (isError ? ' error' : '');
      }

      const registerMessage = document.querySelector('#registerMessage');
      if (registerMessage && text.startsWith('Cuenta creada')) {
        registerMessage.textContent = text;
        registerMessage.className = 'form-message';
      }
    }, 0);
  }

  async function readStatus(client, userId) {
    if (!userId) return null;
    const { data, error } = await client
      .from('profiles')
      .select('account_status')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data?.account_status || null;
  }

  window.supabase.createClient = function urbanStayCreateClient(...args) {
    const client = originalCreateClient(...args);
    if (client.__urbanStayApprovalGateInstalled) return client;
    client.__urbanStayApprovalGateInstalled = true;

    const originalSignIn = client.auth.signInWithPassword.bind(client.auth);
    client.auth.signInWithPassword = async function approvalAwareSignIn(credentials) {
      const result = await originalSignIn(credentials);
      if (result.error || !result.data?.user) return result;

      const status = await readStatus(client, result.data.user.id);
      if (status === 'approved') return result;

      await client.auth.signOut();
      const rejected = status === 'rejected';
      const message = rejected
        ? 'Tu solicitud de acceso ha sido rechazada. Si crees que se trata de un error, contacta con Urban Stay.'
        : 'Tu cuenta está pendiente de aprobación por Urban Stay. Te avisaremos cuando puedas acceder.';
      showLoginStatus(message, true);
      return { data: { user: null, session: null }, error: new Error(message) };
    };

    const originalSignUp = client.auth.signUp.bind(client.auth);
    client.auth.signUp = async function approvalAwareSignUp(credentials) {
      const result = await originalSignUp(credentials);
      if (result.error || !result.data?.user) return result;

      if (result.data.session) await client.auth.signOut();
      const message = 'Cuenta creada correctamente. Queda pendiente de aprobación por Urban Stay antes de poder acceder.';
      showLoginStatus(message, false);
      return { data: result.data, error: new Error(message) };
    };

    return client;
  };
})();
