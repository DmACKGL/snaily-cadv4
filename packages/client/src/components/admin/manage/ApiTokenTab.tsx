import * as React from "react";
import { Tab } from "@headlessui/react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { PasswordInput } from "components/form/Input";
import { Toggle } from "components/form/Toggle";
import { Loader } from "components/Loader";
import { useAuth } from "context/AuthContext";
import { Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";

export const ApiTokenTab = () => {
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { cad } = useAuth();

  const [token, setToken] = React.useState("");

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/admin/manage/cad-settings/api-token", {
      method: "PUT",
      data: values,
    });

    if (json.token) {
      setToken(json.token);
    }
  }

  async function handleRegenerate() {
    const { json } = await execute("/admin/manage/cad-settings/api-token", {
      method: "DELETE",
    });

    if (json.token) {
      setToken(json.token);
    }
  }

  function handleClick(e: React.MouseEvent<HTMLInputElement>) {
    const t = e.target as HTMLInputElement;
    t.select();
  }

  const INITIAL_VALUES = {
    enabled: cad?.apiToken?.enabled ?? false,
    token: cad?.apiToken?.token ?? "",
  };

  return (
    <Tab.Panel>
      <h2 className="text-2xl font-semibold mt-2">Public API access</h2>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, handleSubmit, values }) => (
          <form className="mt-3 space-y-5" onSubmit={handleSubmit}>
            <FormField label="Token">
              <PasswordInput
                onChange={void 0}
                onClick={handleClick}
                readOnly
                value={token || values.token}
              />
            </FormField>

            <FormField fieldId="enabled" label={"Enabled"}>
              <Toggle
                text="enable/disable"
                toggled={values.enabled}
                onClick={handleChange}
                name="enabled"
              />
            </FormField>

            <div className="flex">
              {cad?.apiTokenId ? (
                <Button
                  onClick={handleRegenerate}
                  variant="danger"
                  className="flex items-center mr-2"
                  type="button"
                  disabled={state === "loading"}
                >
                  {state === "loading" ? <Loader className="border-red-300 mr-3" /> : null}
                  {"Re-generate Token"}
                </Button>
              ) : null}
              <Button className="flex items-center" type="submit" disabled={state === "loading"}>
                {state === "loading" ? <Loader className="border-red-300 mr-3" /> : null}
                {common("save")}
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </Tab.Panel>
  );
};
