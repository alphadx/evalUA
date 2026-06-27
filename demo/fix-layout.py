import pathlib

p = pathlib.Path(r"F:\codigos\evalUA\demo\views\layouts\main.php")
content = p.read_text(encoding="utf-8")

# 1. Add 'ver-rubrica' to ALUMNO pages in ROLE_CONFIG
content = content.replace(
    "pages: ['index', 'resultado']\n    },\n    'MANTENEDOR'",
    "pages: ['index', 'resultado', 'ver-rubrica']\n    },\n    'MANTENEDOR'"
)

# 2. Add 'ver-rubrica' to PAGE_URLS
content = content.replace(
    "'resultado': '<?php echo Url::to([\"site/resultado\"]) ?>'\n}",
    "'resultado': '<?php echo Url::to([\"site/resultado\"]) ?>',\n    'ver-rubrica': '<?php echo Url::to([\"site/ver-rubrica\"]) ?>'\n}"
)

# 3. Add nav link for "Ver Rúbrica" after the "Resultados" nav link
old_nav = '''<a href="<?= Url::to(['site/resultado']) ?>" class="nav-link <?= $currentPage === 'resultado' ? 'nav-link-active' : '' ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>
                    <span class="hidden lg:inline">Resultados</span>
                </a>
            </nav>'''

new_nav = '''<a href="<?= Url::to(['site/resultado']) ?>" class="nav-link <?= $currentPage === 'resultado' ? 'nav-link-active' : '' ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg>
                    <span class="hidden lg:inline">Resultados</span>
                </a>
                <a href="<?= Url::to(['site/ver-rubrica']) ?>" class="nav-link <?= $currentPage === 'ver-rubrica' ? 'nav-link-active' : '' ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <span class="hidden lg:inline">Ver Rúbrica</span>
                </a>
            </nav>'''

content = content.replace(old_nav, new_nav)

# 4. Add to mobile menu
old_mobile = '''<a href="<?= Url::to(['site/resultado']) ?>" class="mobile-nav-item <?= $currentPage === 'resultado' ? 'active' : '' ?>">Resultados</a>
    </nav>'''

new_mobile = '''<a href="<?= Url::to(['site/resultado']) ?>" class="mobile-nav-item <?= $currentPage === 'resultado' ? 'active' : '' ?>">Resultados</a>
        <a href="<?= Url::to(['site/ver-rubrica']) ?>" class="mobile-nav-item <?= $currentPage === 'ver-rubrica' ? 'active' : '' ?>">Ver Rúbrica</a>
    </nav>'''

content = content.replace(old_mobile, new_mobile)

p.write_text(content, encoding="utf-8")
print("Layout updated successfully")
