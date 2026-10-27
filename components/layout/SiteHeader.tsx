"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation.ts";
import { primaryNav, type NavMenu } from "@/data/navigation.ts";
import { useContact } from "@/components/site/ContactProvider.tsx";
import { ArrowUpRight, Chevron, Close } from "@/components/ui/icons.tsx";
import { SparkMark, Wordmark } from "@/components/ui/Wordmark.tsx";
import { useFocusTrap } from "@/components/ui/useFocusTrap.ts";
import { useBrief } from "@/components/brief/BriefProvider.tsx";
import { LanguageSwitcher } from "./LanguageSwitcher.tsx";
import { ThemeToggle } from "./ThemeToggle.tsx";
import { markMotionReady } from "@/components/motion/motion-env.ts";

type MenuKey = NavMenu["key"];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const tA = useTranslations("a11y");
  const pathname = usePathname();
  const { open: openBrief } = useBrief();
  const uid = useId();

  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [away, setAway] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const triggerRefs = useRef<Partial<Record<MenuKey, HTMLButtonElement | null>>>({});
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Scroll material + hide-on-scroll-down / show-on-scroll-up.
  useEffect(() => {
    markMotionReady();
    let last = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressRef.current?.style.setProperty("--progress", String(max > 0 ? Math.min(1, y / max) : 0));
      setScrolled(y > 8);
      const delta = y - last;
      if (Math.abs(delta) > 6) {
        setAway(delta > 0 && y > 160);
        last = y;
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Let sticky sub-navigation (pricing categories) sit below the header while it is visible.
  useEffect(() => {
    const isAway = away && !openMenu && !drawerOpen;
    document.documentElement.dataset.headerAway = isAway ? "true" : "false";
  }, [away, openMenu, drawerOpen]);

  // Close menus on route change.
  useEffect(() => {
    setOpenMenu(null);
    setDrawerOpen(false);
  }, [pathname]);

  const closeMenu = useCallback((returnFocus = false) => {
    setOpenMenu((current) => {
      if (returnFocus && current) triggerRefs.current[current]?.focus();
      return null;
    });
  }, []);

  // Escape + click outside for desktop menus.
  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu(true);
    };
    const onPointer = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) closeMenu(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [openMenu, closeMenu]);

  const hoverOpen = (key: MenuKey) => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenMenu(key), 90);
  };
  const hoverClose = () => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenMenu(null), 180);
  };

  // Sliding highlight behind the hovered / current nav item.
  const moveIndicator = (el: HTMLElement | null) => {
    const ul = navRef.current;
    if (!ul) return;
    if (!el) {
      ul.dataset.indicator = "off";
      return;
    }
    const a = ul.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    ul.style.setProperty("--ind-x", `${b.left - a.left}px`);
    ul.style.setProperty("--ind-w", `${b.width}px`);
    ul.dataset.indicator = "on";
  };

  const menus = primaryNav.filter((i): i is { type: "menu" } & NavMenu => i.type === "menu");

  return (
    <header
      ref={headerRef}
      className="site-header"
      data-material={scrolled || openMenu ? "true" : "false"}
      data-away={away && !openMenu && !drawerOpen ? "true" : "false"}
    >
      <a className="skip-link" href="#main">
        {tA("skipToContent")}
      </a>
      <div className="site-header__bar">
        <Link href="/" className="site-header__logo" aria-label={tA("home")}>
          <Wordmark />
        </Link>

        <nav className="site-header__nav" aria-label={tA("mainNav")}>
          <ul
            role="list"
            ref={navRef}
            data-indicator="off"
            onMouseOver={(e) => moveIndicator((e.target as HTMLElement).closest(".nav-link"))}
            onMouseLeave={() => moveIndicator(null)}
          >
            {primaryNav.map((item) =>
              item.type === "link" ? (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="nav-link"
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  >
                    {t(item.key)}
                  </Link>
                </li>
              ) : (
                <li key={item.key} onMouseEnter={() => hoverOpen(item.key)} onMouseLeave={hoverClose}>
                  <button
                    type="button"
                    ref={(el) => {
                      triggerRefs.current[item.key] = el;
                    }}
                    className="nav-link nav-link--menu"
                    aria-expanded={openMenu === item.key}
                    aria-controls={`${uid}-${item.key}`}
                    data-active={item.links.some((l) => isActive(pathname, l.href)) || isActive(pathname, item.href) ? "true" : undefined}
                    onClick={() => setOpenMenu((m) => (m === item.key ? null : item.key))}
                  >
                    {t(item.key)}
                    <Chevron size={12} />
                  </button>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="site-header__actions">
          <LanguageSwitcher />
          <ThemeToggle />
          <button type="button" className="talk-btn" onClick={() => openBrief()} aria-haspopup="dialog" data-magnetic>
            <span className="talk-btn__full">{t("letsTalk")}</span>
            <span className="talk-btn__short">{t("letsTalkShort")}</span>
            <ArrowUpRight />
          </button>
          <button
            type="button"
            className="menu-trigger"
            aria-expanded={drawerOpen}
            aria-controls={`${uid}-drawer`}
            aria-label={tA("openMenu")}
            onClick={() => setDrawerOpen(true)}
          >
            <span aria-hidden="true">
              <i />
              <i />
            </span>
          </button>
        </div>
        <span className="site-header__progress" ref={progressRef} aria-hidden="true" />
      </div>

      {menus.map((menu) => (
        <div
          key={menu.key}
          id={`${uid}-${menu.key}`}
          className="menu-panel"
          hidden={openMenu !== menu.key}
          onMouseEnter={() => clearTimeout(hoverTimer.current)}
          onMouseLeave={hoverClose}
        >
          <div className="menu-panel__intro">
            <span className="menu-panel__glow" aria-hidden="true" />
            <SparkMark className="menu-panel__mark" />
            <p>{t(menu.key === "services" ? "servicesIntro" : "studioIntro")}</p>
            <Link href={menu.href} className="menu-panel__explore" onClick={() => setOpenMenu(null)}>
              {t("exploreSection")} <ArrowUpRight />
            </Link>
          </div>
          <ul role="list" className="menu-panel__links">
            {menu.links.map((l, i) => (
              <li key={l.key} style={{ "--i": i } as CSSProperties}>
                <Link
                  href={l.href}
                  aria-current={isActive(pathname, l.href) ? "page" : undefined}
                  onClick={() => setOpenMenu(null)}
                >
                  <span>{t(`items.${l.key}` as never)}</span>
                  <ArrowUpRight />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <MobileDrawer
        id={`${uid}-drawer`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onTalk={() => {
          setDrawerOpen(false);
          openBrief();
        }}
        pathname={pathname}
      />
    </header>
  );
}

function MobileDrawer({
  id,
  open,
  onClose,
  onTalk,
  pathname,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
  onTalk: () => void;
  pathname: string;
}) {
  const t = useTranslations("nav");
  const tA = useTranslations("a11y");
  const contact = useContact();
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<MenuKey | null>(null);

  useFocusTrap(ref, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.dataset.scrollLock = "true";
    const behind = [document.getElementById("main"), document.querySelector<HTMLElement>(".site-footer")].filter(
      (el): el is HTMLElement => Boolean(el),
    );
    behind.forEach((el) => el.setAttribute("inert", ""));
    return () => {
      document.removeEventListener("keydown", onKey);
      delete document.body.dataset.scrollLock;
      behind.forEach((el) => el.removeAttribute("inert"));
    };
  }, [open, onClose]);

  return (
    <div
      id={id}
      ref={ref}
      className="drawer"
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label={t("menu")}
      data-open={open ? "true" : "false"}
      hidden={!open}
    >
      <div className="drawer__head">
        <Link href="/" className="site-header__logo" aria-label={tA("home")} onClick={onClose}>
          <Wordmark />
        </Link>
        <div className="drawer__tools">
          <ThemeToggle />
          <button type="button" className="icon-btn drawer__close" onClick={onClose} aria-label={tA("closeMenu")}>
            <Close size={20} />
          </button>
        </div>
      </div>
      <p className="eyebrow eyebrow--muted drawer__label">{t("menu")}</p>
      <ul role="list" className="drawer__links">
        {primaryNav.map((item, i) => (
          <li key={item.key} style={{ "--i": i } as CSSProperties}>
            {item.type === "link" ? (
              <Link
                href={item.href}
                className="drawer__link"
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                onClick={onClose}
              >
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <span className="drawer__text">{t(item.key)}</span>
                <ArrowUpRight size={18} />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  className="drawer__link"
                  aria-expanded={expanded === item.key}
                  aria-controls={`${id}-${item.key}`}
                  onClick={() => setExpanded((e) => (e === item.key ? null : item.key))}
                >
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="drawer__text">{t(item.key)}</span>
                  <Chevron size={18} />
                </button>
                <ul role="list" id={`${id}-${item.key}`} className="drawer__sub" hidden={expanded !== item.key}>
                  <li>
                    <Link href={item.href} onClick={onClose}>
                      {t("exploreSection")}
                      <ArrowUpRight />
                    </Link>
                  </li>
                  {item.links.map((l) => (
                    <li key={l.key}>
                      <Link href={l.href} aria-current={isActive(pathname, l.href) ? "page" : undefined} onClick={onClose}>
                        {t(`items.${l.key}` as never)}
                        <ArrowUpRight />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="drawer__foot">
        <p className="drawer__tagline">{t("menuTagline")}</p>
        <button type="button" className="btn btn--primary btn--block" onClick={onTalk} aria-haspopup="dialog">
          {t("letsTalk")} <ArrowUpRight />
        </button>
        {contact.salesEmail ? (
          <a className="drawer__mail" href={`mailto:${contact.salesEmail}`}>
            {contact.salesEmail}
          </a>
        ) : null}
        <LanguageSwitcher variant="drawer" />
      </div>
    </div>
  );
}
