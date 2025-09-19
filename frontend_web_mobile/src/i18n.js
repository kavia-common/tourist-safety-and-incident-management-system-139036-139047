import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        language: "Language",
        login: "Login",
        signup: "Sign Up",
        logout: "Logout",
        getStarted: "Get Started",
        touristHome: "Tourist Home",
        dashboard: "Dashboard",
        incidents: "Incidents",
        heatmap: "Heatmap"
      },
      welcome: {
        title: "Welcome to Cosmic Safety",
        desc: "Select your role to begin. Real-time alerts, digital ID, dashboards and more."
      },
      auth: {
        email: "Email",
        password: "Password",
        role: "Role",
        login: "Login",
        signup: "Create account",
        haveAccount: "Already have an account?",
        noAccount: "Don't have an account?",
        chooseRole: "Choose your role"
      },
      roles: {
        tourist: "Tourist",
        authority: "Authority",
        family: "Family"
      },
      tourist: {
        myDigitalId: "My Digital ID",
        safetyStatus: "Safety Status",
        liveMap: "Live Map",
        alerts: "Alerts",
        panic: "Panic",
        openPanic: "Open Panic",
        cancel: "Cancel",
        submit: "Send Panic",
        panicTitle: "Confirm Panic",
        panicDesc: "Share your location and a short note to notify authorities.",
        note: "Note (optional)"
      },
      authority: {
        overview: "Overview",
        tourists: "Tourists",
        eventFeed: "Event Feed",
        heatmap: "Heatmap",
        metrics: "Metrics"
      },
      family: {
        tracking: "Tracking",
        subscribe: "Subscribe to Alerts",
        linkedTourists: "Linked Tourists"
      }
    }
  },
  es: {
    translation: {
      nav: { language: "Idioma", login: "Iniciar sesión", signup: "Crear cuenta", logout: "Salir", getStarted: "Comenzar", touristHome: "Inicio Turista", dashboard: "Panel", incidents: "Incidentes", heatmap: "Mapa" },
      welcome: { title: "Bienvenido a Cosmic Safety", desc: "Seleccione su rol para comenzar. Alertas en tiempo real, ID digital, paneles y más." },
      auth: { email: "Correo", password: "Contraseña", role: "Rol", login: "Ingresar", signup: "Crear cuenta", haveAccount: "¿Ya tienes cuenta?", noAccount: "¿No tienes cuenta?", chooseRole: "Elige tu rol" },
      roles: { tourist: "Turista", authority: "Autoridad", family: "Familia" },
      tourist: { myDigitalId: "Mi ID Digital", safetyStatus: "Estado de Seguridad", liveMap: "Mapa en Vivo", alerts: "Alertas", panic: "Pánico", openPanic: "Abrir Pánico", cancel: "Cancelar", submit: "Enviar Pánico", panicTitle: "Confirmar Pánico", panicDesc: "Comparte tu ubicación y una nota para notificar a las autoridades.", note: "Nota (opcional)" },
      authority: { overview: "Resumen", tourists: "Turistas", eventFeed: "Eventos", heatmap: "Mapa", metrics: "Métricas" },
      family: { tracking: "Seguimiento", subscribe: "Suscribirse a Alertas", linkedTourists: "Turistas Vinculados" }
    }
  },
  fr: {
    translation: {
      nav: { language: "Langue", login: "Connexion", signup: "Créer un compte", logout: "Déconnexion", getStarted: "Commencer", touristHome: "Accueil Touriste", dashboard: "Tableau de bord", incidents: "Incidents", heatmap: "Carte" },
      welcome: { title: "Bienvenue à Cosmic Safety", desc: "Sélectionnez votre rôle pour commencer. Alertes en temps réel, ID numérique, tableaux de bord et plus." },
      auth: { email: "Email", password: "Mot de passe", role: "Rôle", login: "Connexion", signup: "Créer", haveAccount: "Vous avez déjà un compte?", noAccount: "Pas de compte?", chooseRole: "Choisissez votre rôle" },
      roles: { tourist: "Touriste", authority: "Autorité", family: "Famille" },
      tourist: { myDigitalId: "Mon ID Numérique", safetyStatus: "Statut de Sécurité", liveMap: "Carte en direct", alerts: "Alertes", panic: "Panique", openPanic: "Ouvrir Panique", cancel: "Annuler", submit: "Envoyer Panique", panicTitle: "Confirmer Panique", panicDesc: "Partagez votre position et une note pour avertir les autorités.", note: "Note (optionnel)" },
      authority: { overview: "Aperçu", tourists: "Touristes", eventFeed: "Flux d'événements", heatmap: "Carte", metrics: "Métriques" },
      family: { tracking: "Suivi", subscribe: "S'abonner aux alertes", linkedTourists: "Touristes liés" }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    interpolation: { escapeValue: false }
  });

export default i18n;
