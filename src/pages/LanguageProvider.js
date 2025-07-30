import React, { useState, createContext, useEffect, useCallback, useContext, useRef} from 'react';
import '../LanguageSelector.css';
import '../LanguageGlobe.css';

// 1. Define LanguageContext
export const LanguageContext = createContext();

// 2. Define your translations (Keep all your translations here)
const translations = {
  // ... (Your existing 'English', 'Spanish', 'Arabic' translation objects) ...
  // Ensure you have all the necessary translations for your app, including new ones from UserSettingsPage
  'English': {
    welcome: 'Welcome!',
    chooseLanguage: 'Choose language',
    selectLanguageButton: 'Select Language',
    confirmSelection: '✔️ Confirm Selection',
    close: '✖️ Close',
    clickToChoose: 'Click the button to choose your your language.',
    currentLanguageDisplay: 'Current Language:',
    brandName: 'Shopify',
    tagline: 'Talking',
    loginFailed: 'Login failed.',
    phoneNumberPlaceholder: 'Phone Number',
    passwordPlaceholder: 'Password',
    logInButton: 'LOG IN',
    loggingInButton: 'Logging in...',
    createAccountLink: 'Create an account',
    poweredBy: 'Powered by Shopify',
    logoutButton: 'Logout',
    loadingText: 'Loading...',
    currencySymbol: '$',
    addFundsButton: 'Add Funds',
    topProductsHeading: 'Top Products',
    loadingProductsText: 'Loading products... ⏳',
    errorLoadingProducts: 'Error: Failed to load products. 🙁',
    noProductsFound: 'No products found. 😔',
    congratulationsPrefix: '🎉 Congratulations to',
    startMakingMoneyButton: 'START MAKING MONEY',
    aboutUsHeading: 'About Us',
    aboutUsText: 'We are committed to offering curated, trending, and premium products through our platform.',
    latestIncidentHeading: 'Latest Incident',
    noReportedIncidents: 'No reported incidents at this time.',
    trcHeading: 'TRC',
    trcText: 'Transparency Reporting Center - All transactions and activity are monitored for your security.',
    faqHeading: 'FAQ',
    partnerPlaceholder: 'Partner',
    faq1Question: 'How do I start earning?',
    faq1Answer: 'You can start earning by clicking the “START MAKING MONEY” button and completing tasks or sharing your affiliate links.',
    faq2Question: 'How do I track my orders?',
    faq2Answer: 'Orders can be tracked via the “Orders” section in the sidebar. You\'ll see real-time updates there.',
    faq3Question: 'Where can I view my payments?',
    faq3Answer: 'All payment history and upcoming payouts are available under the “Profile” or “Payments” tab in your account dashboard.',
    registrationTo: 'Registration to',
    createYourAccount: 'Create your account',
    fillAllFields: 'Please fill all required fields.',
    passwordsMismatch: 'Passwords do not match.',
    referralCodeRequired: 'Referral code is required for registration.',
    registrationSuccessful: 'Registration successful!',
    registrationFailed: 'Registration failed. Please try again.',
    usernamePlaceholder: 'Username',
    confirmPasswordPlaceholder: 'Confirm password',
    withdrawalPasswordPlaceholder: 'Withdrawal password',
    referralCodePlaceholder: 'Referral Code (Required)',
    registerButton: 'REGISTER',
    backToLoginLink: 'Back to Login',
    uncompletedOrders: 'Uncompleted Orders',
    completedOrders: 'Completed Orders',
    dailyOrders: 'Daily Orders',
    startOrderTask: 'START ORDER TASK',
    failedLoadSummary: 'Failed to load dashboard summary.',
    retryButton: 'Retry',
    // UserSettingsPage specific translations
    changePasswordOption: 'Change Password',
    currentPasswordLabel: 'Current Password',
    newPasswordLabel: 'New Password',
    confirmNewPasswordLabel: 'Confirm New Password',
    passwordsDoNotMatch: 'Passwords do not match.',
    passwordTooShort: 'Password must be at least 6 characters long.',
    passwordChangedSuccess: 'Password changed successfully!',
    failedToChangePassword: 'Failed to change password.',
    saving: 'Saving...',
    saveChanges: 'Save Changes',
    backButton: 'Back',
    failedToLoadProfile: 'Failed to load profile.',
    rechargeWalletAddressLabel: 'Recharge Wallet Address:',
    notAvailable: 'Not Available',
    withdrawOption: 'Withdraw',
    changeLanguageOption: 'Change Language',
    customerServiceOption: 'Customer Service',
  },
  'Spanish': {
    welcome: '¡Bienvenido!',
    chooseLanguage: 'Elija un idioma',
    selectLanguageButton: 'Seleccionar idioma',
    confirmSelection: '✔️ Confirmar selección',
    close: '✖️ Cerrar',
    clickToChoose: 'Haga clic en el botón para elegir su idioma.',
    currentLanguageDisplay: 'Idioma actual:',
    brandName: 'Shopify',
    tagline: 'Hablando',
    loginFailed: 'Inicio de sesión fallido.',
    phoneNumberPlaceholder: 'Número de teléfono',
    passwordPlaceholder: 'Contraseña',
    logInButton: 'INICIAR SESIÓN',
    loggingInButton: 'Iniciando sesión...',
    createAccountLink: 'Crear una cuenta',
    poweredBy: 'Desarrollado por Shopify',
    logoutButton: 'Cerrar sesión',
    loadingText: 'Cargando...',
    currencySymbol: '$',
    addFundsButton: 'Añadir fondos',
    topProductsHeading: 'Productos principales',
    loadingProductsText: 'Cargando productos... ⏳',
    errorLoadingProducts: 'Error: No se pudieron cargar los productos. 🙁',
    noProductsFound: 'No se encontraron productos. 😔',
    congratulationsPrefix: '🎉 Felicidades a',
    startMakingMoneyButton: 'EMPEZAR A GANAR DINERO',
    aboutUsHeading: 'Sobre nosotros',
    aboutUsText: 'Estamos comprometidos a ofrecer productos curados, de moda y premium a través de nuestra plataforma.',
    latestIncidentHeading: 'Último incidente',
    noReportedIncidents: 'No hay incidentes reportados en este momento.',
    trcHeading: 'TRC',
    trcText: 'Centro de informes de transparencia - Todas las transacciones y actividades son monitoreadas para su seguridad.',
    faqHeading: 'Preguntas frecuentes',
    partnerPlaceholder: 'Socio',
    faq1Question: '¿Cómo empiezo a ganar dinero?',
    faq1Answer: 'Puede empezar a ganar dinero haciendo clic en el botón “EMPEZAR A GANAR DINERO” y completando tareas o compartiendo sus enlaces de afiliado.',
    faq2Question: '¿Cómo hago seguimiento de mis pedidos?',
    faq2Answer: 'Los pedidos se pueden rastrear a través de la sección “Pedidos” en la barra lateral. Allí verá actualizaciones en tiempo real.',
    faq3Question: '¿Dónde puedo ver mis pagos?',
    faq3Answer: 'Todo el historial de pagos y los próximos desembolsos están disponibles en la pestaña “Perfil” o “Pagos” en el panel de su cuenta.',
    registrationTo: 'Registro en',
    createYourAccount: 'Crea tu cuenta',
    fillAllFields: 'Por favor, rellene todos los campos obligatorios.',
    passwordsMismatch: 'Las contraseñas no coinciden.',
    referralCodeRequired: 'El código de referencia es obligatorio para el registro.',
    registrationSuccessful: '¡Registro exitoso!',
    registrationFailed: 'Error en el registro. Por favor, inténtelo de nuevo.',
    usernamePlaceholder: 'Nombre de usuario',
    confirmPasswordPlaceholder: 'Confirmar contraseña',
    withdrawalPasswordPlaceholder: 'Contraseña de retiro',
    referralCodePlaceholder: 'Código de referencia (Obligatorio)',
    registerButton: 'REGISTRARSE',
    backToLoginLink: 'Volver a Iniciar sesión',
    uncompletedOrders: 'Pedidos incompletos',
    completedOrders: 'Pedidos completados',
    dailyOrders: 'Pedidos diarios',
    startOrderTask: 'INICIAR TAREA DE PEDIDO',
    failedLoadSummary: 'No se pudo cargar el resumen del panel.',
    retryButton: 'Reintentar',
    changePasswordOption: 'Cambiar Contraseña',
    currentPasswordLabel: 'Contraseña Actual',
    newPasswordLabel: 'Nueva Contraseña',
    confirmNewPasswordLabel: 'Confirmar Nueva Contraseña',
    passwordsDoNotMatch: 'Las contraseñas no coinciden.',
    passwordTooShort: 'La contraseña debe tener al menos 6 caracteres.',
    passwordChangedSuccess: '¡Contraseña cambiada exitosamente!',
    failedToChangePassword: 'Fallo al cambiar la contraseña.',
    saving: 'Guardando...',
    saveChanges: 'Guardar Cambios',
    backButton: 'Atrás',
    failedToLoadProfile: 'Fallo al cargar el perfil.',
    rechargeWalletAddressLabel: 'Dirección de la Billetera de Recarga:',
    notAvailable: 'No Disponible',
    withdrawOption: 'Retirar',
    changeLanguageOption: 'Cambiar Idioma',
    customerServiceOption: 'Atención al Cliente',
  },
  'Arabic': {
    welcome: 'أهلاً بك!',
    chooseLanguage: 'اختر اللغة',
    selectLanguageButton: 'اختر اللغة',
    confirmSelection: '✔️ تأكيد الاختيار',
    close: '✖️ إغلاق',
    clickToChoose: 'انقر الزر لاختيار لغتك.',
    currentLanguageDisplay: 'اللغة الحالية:',
    brandName: 'شوبيفاي',
    tagline: 'يتحدث',
    loginFailed: 'فشل تسجيل الدخول.',
    phoneNumberPlaceholder: 'رقم الهاتف',
    passwordPlaceholder: 'كلمة المرور',
    logInButton: 'تسجيل الدخول',
    loggingInButton: 'جاري تسجيل الدخول...',
    createAccountLink: 'إنشاء حساب',
    poweredBy: 'مدعوم من شوبيفاي',
    logoutButton: 'تسجيل الخروج',
    loadingText: 'جاري التحميل...',
    currencySymbol: '$',
    addFundsButton: 'إضافة أموال',
    topProductsHeading: 'أهم المنتجات',
    loadingProductsText: 'جاري تحميل المنتجات... ⏳',
    errorLoadingProducts: 'خطأ: فشل تحميل المنتجات. 🙁',
    noProductsFound: 'لم يتم العثور على منتجات. 😔',
    congratulationsPrefix: '🎉 تهانينا لـ',
    startMakingMoneyButton: 'ابدأ بكسب المال',
    aboutUsHeading: 'من نحن',
    aboutUsText: 'نحن ملتزمون بتقديم منتجات منسقة ورائجة ومميزة عبر منصتنا.',
    latestIncidentHeading: 'آخر حادث',
    noReportedIncidents: 'لا توجد حوادث مبلغ عنها في الوقت الحالي.',
    trcHeading: 'TRC',
    trcText: 'مركز تقارير الشفافية - يتم مراقبة جميع المعاملات والأنشطة لأمانك.',
    faqHeading: 'الأسئلة الشائعة',
    partnerPlaceholder: 'شريك',
    faq1Question: 'كيف أبدأ الكسب؟',
    faq1Answer: 'يمكنك البدء في الكسب بالنقر على زر "ابدأ بكسب المال" وإكمال المهام أو مشاركة روابط الإحالة الخاصة بك.',
    faq2Question: 'كيف أتتبع طلباتي؟',
    faq2Answer: 'يمكن تتبع الطلبات عبر قسم "الطلبات" في الشريط الجانبي. سترى تحديثات في الوقت الفعلي هناك.',
    faq3Question: 'أين يمكنني عرض مدفوعاتي؟',
    faq3Answer: 'جميع سجلات الدفع والمدفوعات القادمة متاحة تحت علامة التبويب "الملف الشخصي" أو "المدفوعات" في لوحة تحكم حسابك.',
    registrationTo: 'التسجيل في',
    createYourAccount: 'أنشئ حسابك',
    fillAllFields: 'الرجاء ملء جميع الحقول المطلوبة.',
    passwordsMismatch: 'كلمات المرور غير متطابقة.',
    referralCodeRequired: 'رمز الإحالة مطلوب للتسجيل.',
    registrationSuccessful: 'تم التسجيل بنجاح!',
    registrationFailed: 'فشل التسجيل. الرجاء المحاولة مرة أخرى.',
    usernamePlaceholder: 'اسم المستخدم',
    confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
    withdrawalPasswordPlaceholder: 'كلمة مرور السحب',
    referralCodePlaceholder: 'رمز الإحالة (مطلوب)',
    registerButton: 'تسجيل',
    backToLoginLink: 'العودة إلى تسجيل الدخول',
    uncompletedOrders: 'الطلبات غير المكتملة',
    completedOrders: 'الطلبات المكتملة',
    dailyOrders: 'الطلبات اليومية',
    startOrderTask: 'بدء مهمة الطلب',
    failedLoadSummary: 'فشل تحميل ملخص لوحة التحكم.',
    retryButton: 'إعادة المحاولة',
    changePasswordOption: 'تغيير كلمة المرور',
    currentPasswordLabel: 'كلمة المرور الحالية',
    newPasswordLabel: 'كلمة المرور الجديدة',
    confirmNewPasswordLabel: 'تأكيد كلمة المرور الجديدة',
    passwordsDoNotMatch: 'كلمات المرور غير متطابقة.',
    passwordTooShort: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
    passwordChangedSuccess: 'تم تغيير كلمة المرور بنجاح!',
    failedToChangePassword: 'فشل تغيير كلمة المرور.',
    saving: 'جاري الحفظ...',
    saveChanges: 'حفظ التغييرات',
    backButton: 'رجوع',
    failedToLoadProfile: 'فشل تحميل الملف الشخصي.',
    rechargeWalletAddressLabel: 'عنوان محفظة الشحن:',
    notAvailable: 'غير متوفر',
    withdrawOption: 'سحب',
    changeLanguageOption: 'تغيير اللغة',
    customerServiceOption: 'خدمة العملاء',
  },
};

// 3. LanguageProvider component to manage language state and provide translations
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(
    localStorage.getItem('language') || 'English' // Default to English
  );

  useEffect(() => {
    localStorage.setItem('language', currentLanguage);
  }, [currentLanguage]);

  // The translation function 't'
  const t = useCallback((key) => {
    return translations[currentLanguage][key] || key; // Fallback to key if translation not found
  }, [currentLanguage]);

  // FIX: Define languagesArray here to be passed to context
  const languagesArray = Object.keys(translations);

  return (
    <LanguageContext.Provider value={{ currentLanguage, setCurrentLanguage, t, languages: languagesArray }}> {/* Use languagesArray here */}
      {children}
    </LanguageContext.Provider>
  );
};

// 4. LanguageSelector component (your globe icon UI)
// This component now *reverts* to managing its own internal state for visibility
const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false); // Internal state for this component
  const { currentLanguage, setCurrentLanguage, t } = useContext(LanguageContext);
  const [tempSelectedLanguage, setTempSelectedLanguage] = useState(currentLanguage);
  const languages = Object.keys(translations); // This is correctly defined here for LanguageSelector's scope

  // Ref for click outside
  const selectorRef = useRef(null); // useRef is correctly imported and used here

  useEffect(() => {
    setTempSelectedLanguage(currentLanguage);
  }, [isOpen, currentLanguage]);

  // Handle click outside to close the modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]); // Depend on isOpen

  const handleConfirm = () => {
    setCurrentLanguage(tempSelectedLanguage);
    setIsOpen(false); // Close modal on confirm
  };

  const handleLanguageClick = (lang) => {
    setTempSelectedLanguage(lang);
  };

  return (
    <>
      {/* The Globe Icon - Only rendered here for general usage */}
      <img
        src="https://cdn-icons-png.flaticon.com/512/44/44386.png"
        alt="Globe Icon"
        className="globe-icon"
        onClick={() => setIsOpen(true)} // This click opens the modal
        title={t('selectLanguageButton')}
      />

      {/* The Language Selection Modal (Overlay) */}
      {isOpen && (
        <div className="language-overlay">
          <div className="language-selector" ref={selectorRef}> {/* Attach ref here */}
            <button
              className="close-button"
              onClick={() => setIsOpen(false)}
              title={t('close')}
            >
              ✖️
            </button>
            <div className="language-dropdown">
              <p className="choose-label">{t('chooseLanguage')}</p>
              <ul>
                {languages.map((lang) => (
                  <li
                    key={lang}
                    className={lang === tempSelectedLanguage ? 'active' : ''}
                    onClick={() => handleLanguageClick(lang)}
                  >
                    {lang}
                  </li>
                ))}
              </ul>
            </div>
            <button
              className="submit-button"
              onClick={handleConfirm}
              title={t('confirmSelection')}
            >
              {t('confirmSelection')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// 5. Export the LanguageSelector component as default
export default LanguageSelector;