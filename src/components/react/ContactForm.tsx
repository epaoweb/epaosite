import React, { useState } from "react";
import { Input } from "./Input";
import { type IRequestForm, mapIRequestFormToFormData } from "../../types/contact";
import { showSnackbar } from "../../utils/snackbar";
import styles from "./ContactForm.module.css";
import { Turnstile } from "@marsidev/react-turnstile";
import { useTranslations, type Locale } from "../../i18n";

interface ContactFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  onClose: () => void;
}

const initialFormState: IRequestForm = {
  name: { value: "", error: "" },
  email: { value: "", error: "" },
  message: { value: "", error: "" },
  token: "",
};

export const ContactForm: React.FC<ContactFormProps> = ({
  onSubmit,
  onClose,
}: ContactFormProps) => {
  const [form, setForm] = useState<IRequestForm>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [hideTurnstile, setHideTurnstile] = useState(false);
  const locale: Locale = (Astro.cookies.get("lang")?.value as Locale) || "en";
  const i18n = useTranslations(locale).contactForm;

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleChange = (field: keyof IRequestForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: { value, error: "" },
    }));
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    let isValid = true;
    const newForm = { ...form };

    // Validate Name
    if (!newForm.name.value.trim()) {
      newForm.name.error = i18n.name.errorRequired;
      isValid = false;
    }

    // Validate Email
    if (!newForm.email.value.trim()) {
      newForm.email.error = i18n.email.errorRequired;
      isValid = false;
    } else if (!validateEmail(newForm.email.value)) {
      newForm.email.error = i18n.email.errorInvalid;
      isValid = false;
    }

    // Validate Message
    if (!newForm.message.value.trim()) {
      newForm.message.error = i18n.message.errorRequired;
      isValid = false;
    }

    setForm(newForm);

    if (!isValid) return;

    setLoading(true);
    const requestData = mapIRequestFormToFormData(newForm);

    try {
      await onSubmit(requestData);
      showSnackbar(i18n.success, "success");
      setForm(initialFormState); // Reset on success if needed
    } catch (error) {
      showSnackbar(i18n.error, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <Input
        id="name"
        label={i18n.name.label}
        placeholder={i18n.name.placeholder}
        value={form.name.value}
        error={form.name.error}
        onChange={(e) => handleChange("name", e.target.value)}
      />
      <Input
        id="email"
        label={i18n.email.label}
        placeholder={i18n.email.placeholder}
        value={form.email.value}
        error={form.email.error}
        onChange={(e) => handleChange("email", e.target.value)}
      />
      <Input
        id="message"
        label={i18n.message.label}
        placeholder={i18n.message.placeholder}
        textarea
        value={form.message.value}
        error={form.message.error}
        onChange={(e) => handleChange("message", e.target.value)}
      />

      <div className={styles.turnstileWrapper + (hideTurnstile ? " " + styles.hideTurnstile : "")}>
        <Turnstile
          style={{ margin: "0 auto", borderRadius: "12px" }}
          siteKey="0x4AAAAAAESm7CKmhxlXWGcb"
          onSuccess={(token) => {
            setHideTurnstile(true);
            setForm((prev) => ({ ...prev, token }));
          }}
        />
      </div>

      <div className={styles.buttonContainer}>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonOutline}`}
          onClick={onClose}
        >
          {i18n.cancel}
        </button>
        <button
          type="submit"
          className={`${styles.button} ${styles.buttonPrimary}`}
          disabled={loading || !form.token}
        >
          {loading ? (
            <svg
              className={styles.spinner}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M10 14l11 -11" />
              <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
            </svg>
          )}
          {i18n.send}
        </button>
      </div>
    </form>
  );
};
