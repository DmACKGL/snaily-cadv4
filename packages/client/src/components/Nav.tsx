import * as React from "react";
import { Menu, Transition } from "@headlessui/react";
import { PersonCircle } from "react-bootstrap-icons";
import Link from "next/link";
import { useAuth } from "src/context/AuthContext";
import { logout } from "lib/auth";
import { useRouter } from "next/router";
import { classNames } from "lib/classNames";
import { CitizenDropdown } from "./nav-dropdowns/CitizenDropdown";
import { OfficerDropdown } from "./nav-dropdowns/OfficerDropdown";
import { EmsFdDropdown } from "./nav-dropdowns/EmsFdDropdown";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { TowDropdown } from "./nav-dropdowns/TowDropdown";
import { DispatchDropdown } from "./nav-dropdowns/DispatchDropdown";
import { useTranslations } from "next-intl";

export function Nav() {
  const { user, cad } = useAuth();
  const { TOW, COURTHOUSE } = useFeatureEnabled();
  const router = useRouter();
  const t = useTranslations("Nav");
  const isActive = (route: string) => router.pathname.startsWith(route);

  return (
    <nav className="bg-white dark:bg-[#171717] shadow-sm">
      <div className="max-w-[100rem] mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-7">
            <h1 className="text-2xl">
              <a
                href="/citizen"
                className="flex items-center py-3 font-bold text-gray-800 dark:text-white"
              >
                {cad?.name || "SnailyCAD"}
              </a>
            </h1>

            <ul className="items-center hidden space-x-1 md:flex">
              <CitizenDropdown />

              {user?.isTow && TOW ? <TowDropdown /> : null}

              {user?.isLeo ? <OfficerDropdown /> : null}

              {user?.isEmsFd ? <EmsFdDropdown /> : null}

              {user?.isDispatch ? <DispatchDropdown /> : null}

              {COURTHOUSE ? (
                <Link href="/courthouse">
                  <a
                    className={classNames(
                      "py-3 px-2 text-gray-700 dark:text-gray-200 transition duration-300",
                      isActive("/courthouse") && "font-semibold",
                    )}
                  >
                    {t("courthouse")}
                  </a>
                </Link>
              ) : null}

              {user && user.rank !== "USER" ? (
                <Link href="/admin">
                  <a
                    className={classNames(
                      "py-3 px-2 text-gray-700 dark:text-gray-200 transition duration-300",
                      isActive("/admin") && "font-semibold",
                    )}
                  >
                    {t("admin")}
                  </a>
                </Link>
              ) : null}
            </ul>
          </div>

          <div>
            <NavDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavDropdown() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const t = useTranslations("Nav");

  async function handleLogout() {
    const success = await logout();
    if (success) {
      router.push("/auth/login");
      setUser(null);
    }
  }

  return (
    <>
      <Menu as="div" className="relative z-50 inline-block text-left">
        <Menu.Button className="inline-flex justify-center w-full px-1 py-2 text-sm font-medium text-white bg-transparent rounded-md focus:outline-none">
          <PersonCircle className="text-dark-bg dark:text-gray-300" width={20} height={20} />
        </Menu.Button>

        <Transition
          as={React.Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 w-32 mt-0 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-xl dark:bg-dark-bright dark:divide-dark-bg focus:outline-none">
            {user ? (
              <>
                <div className="px-1 py-1">
                  <Menu.Item>
                    <Link href="/account">
                      <a className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg group rounded-md items-center w-full px-3 py-1.5 text-sm transition-all">
                        {t("account")}
                      </a>
                    </Link>
                  </Menu.Item>
                </div>

                <div className="px-1 py-1">
                  <Menu.Item>
                    <button
                      onClick={handleLogout}
                      className="text-red-500 text-left hover:bg-red-500 hover:text-black group rounded-md items-center w-full px-3 py-1.5 text-sm transition-all"
                    >
                      {t("logout")}
                    </button>
                  </Menu.Item>
                </div>
              </>
            ) : (
              <div className="px-1 py-1 ">
                <Menu.Item>
                  <Link href="/auth/login">
                    <a className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg group rounded-md items-center w-full px-3 py-1.5 text-sm transition-all">
                      {t("login")}
                    </a>
                  </Link>
                </Menu.Item>
                <Menu.Item>
                  <Link href="/auth/register">
                    <a className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg group rounded-md items-center w-full px-3 py-1.5 text-sm transition-all">
                      {t("register")}
                    </a>
                  </Link>
                </Menu.Item>
              </div>
            )}
          </Menu.Items>
        </Transition>
      </Menu>
    </>
  );
}
