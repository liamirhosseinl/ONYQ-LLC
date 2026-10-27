import { Link } from "@/i18n/navigation.ts";
import { OpenBriefButton } from "@/components/brief/OpenBriefButton.tsx";
import { ArrowUpRight, ArrowDown } from "@/components/ui/icons.tsx";
import { Scene, SceneGlow, SceneLights, SceneMotes, SceneSpark, SceneStars } from "@/components/art/Scene.tsx";
import { Split, wordCount } from "@/components/motion/Split.tsx";
import { Spark } from "@/components/ui/Wordmark.tsx";
import { HeroMotion } from "./HeroMotion.tsx";
import type { HomeContent } from "@/content/types.ts";

export function Hero({ copy, marquee }: { copy: HomeContent["hero"]; marquee: string[] }) {
  const first = copy.title[0];
  return (
    <HeroMotion>
      <div className="hero__sticky">
        <div className="hero__scene" aria-hidden="true">
          <div className="hero__layer hero__layer--scene" data-depth="0.35">
            <Scene name="hero" ratio={2.5} cover={2.1} focus={[0.74, 0.22]} focusMobile={[0.86, 0]} className="hero__picture" priority>
              <SceneStars count={46} seed={4} area={[0, 1, 100, 34]} />
              <SceneGlow x={12.7} y={28.9} size={12} tone="moon" only="night" />
              <SceneGlow x={95.2} y={43.5} size={22} tone="sun" only="day" />
              <SceneLights count={34} seed={8} area={[2, 60, 62, 74]} />
              <SceneMotes count={18} seed={12} area={[4, 70, 96, 98]} />
              <SceneSpark x={78.3} y={24} size={5.2} />
            </Scene>
          </div>
          <div className="hero__shade" />
        </div>

        <div className="wrap hero__frame">
          <div className="hero__top">
            <p className="hero__chip hero__reveal">
              <span className="hero__live" aria-hidden="true" />
              {copy.chip}
            </p>
          </div>

          <div className="hero__main">
            <h1 id="hero-title" className="t-giant hero__title">
              <span className="block">
                <Split text={first} />
              </span>
              <span className="block tone-2 hero__title-accent">
                <Split text={copy.title[1]} start={wordCount(first)} />
                <Spark className="hero__title-spark" />
              </span>
            </h1>
            <div className="hero__bottom">
              <p className="hero__lead hero__reveal">{copy.lead}</p>
              <div className="hero__actions hero__reveal">
                <OpenBriefButton className="btn btn--primary btn--large" magnetic>
                  {copy.primary} <ArrowUpRight />
                </OpenBriefButton>
                <Link href="/portfolio" className="btn btn--ghost btn--large" data-magnetic="0.2">
                  {copy.secondary}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="hero__foot">
          <div className="marquee hero__marquee" aria-hidden="true">
            <div className="marquee__skew">
              {[0, 1].map((k) => (
                <div className="marquee__track" key={k}>
                  {marquee.map((m) => (
                    <span key={m} className="hero__marquee-item">
                      {m}
                      <Spark className="hero__marquee-spark" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <a href="#studio" className="hero__scroll" aria-label={copy.scroll}>
            <span>{copy.scroll}</span>
            <span className="hero__scroll-line" aria-hidden="true">
              <ArrowDown size={14} />
            </span>
          </a>
        </div>
      </div>
    </HeroMotion>
  );
}
