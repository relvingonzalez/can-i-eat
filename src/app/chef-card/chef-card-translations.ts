export interface ChefCardLanguage {
  code: string;
  label: string;
  title: string;
  intro: string;
  severe: string;
  other: string;
  thanks: string;
  allergens: Record<string, string>;
}

export const CHEF_CARD_LANGUAGES: ChefCardLanguage[] = [
  {
    code: 'en', label: 'English',
    title: 'I have food allergies',
    intro: 'Please make sure my food does not contain the following, including traces and cross-contact from shared surfaces, oil, or utensils:',
    severe: 'This is serious. Even a small amount can make me very sick.',
    other: 'Also:',
    thanks: 'Thank you for your help!',
    allergens: {
      milk: 'Milk and dairy', egg: 'Egg', fish: 'Fish', shellfish: 'Shellfish (crustaceans and mollusks)',
      treenuts: 'Tree nuts (walnuts, almonds, cashews, etc.)', peanut: 'Peanuts', wheat: 'Wheat',
      gluten: 'Gluten (wheat, barley, rye)', soy: 'Soy', sesame: 'Sesame', mustard: 'Mustard', celery: 'Celery',
      lupin: 'Lupin', sulfites: 'Sulfites', corn: 'Corn',
    },
  },
  {
    code: 'es', label: 'Español',
    title: 'Tengo alergias alimentarias',
    intro: 'Por favor, asegúrese de que mi comida no contenga lo siguiente, ni siquiera trazas ni contacto cruzado por superficies, aceite o utensilios compartidos:',
    severe: 'Es grave. Incluso una pequeña cantidad puede hacerme enfermar gravemente.',
    other: 'También:',
    thanks: '¡Gracias por su ayuda!',
    allergens: {
      milk: 'Leche y lácteos', egg: 'Huevo', fish: 'Pescado', shellfish: 'Mariscos (crustáceos y moluscos)',
      treenuts: 'Frutos secos (nueces, almendras, anacardos, etc.)', peanut: 'Cacahuete / maní', wheat: 'Trigo',
      gluten: 'Gluten (trigo, cebada, centeno)', soy: 'Soja', sesame: 'Sésamo / ajonjolí', mustard: 'Mostaza',
      celery: 'Apio', lupin: 'Altramuz', sulfites: 'Sulfitos', corn: 'Maíz',
    },
  },
  {
    code: 'fr', label: 'Français',
    title: "J'ai des allergies alimentaires",
    intro: 'Veuillez vous assurer que mon repas ne contient pas les aliments suivants, y compris sous forme de traces ou par contact croisé (surfaces, huile ou ustensiles partagés) :',
    severe: "C'est sérieux. Même une petite quantité peut me rendre très malade.",
    other: 'Aussi :',
    thanks: 'Merci pour votre aide !',
    allergens: {
      milk: 'Lait et produits laitiers', egg: 'Œuf', fish: 'Poisson', shellfish: 'Crustacés et mollusques',
      treenuts: 'Fruits à coque (noix, amandes, noix de cajou, etc.)', peanut: 'Arachide / cacahuète', wheat: 'Blé',
      gluten: 'Gluten (blé, orge, seigle)', soy: 'Soja', sesame: 'Sésame', mustard: 'Moutarde', celery: 'Céleri',
      lupin: 'Lupin', sulfites: 'Sulfites', corn: 'Maïs',
    },
  },
  {
    code: 'it', label: 'Italiano',
    title: 'Ho allergie alimentari',
    intro: 'Per favore, assicuratevi che il mio cibo non contenga quanto segue, nemmeno in tracce o per contaminazione crociata da superfici, olio o utensili condivisi:',
    severe: 'È una cosa seria. Anche una piccola quantità può farmi stare molto male.',
    other: 'Inoltre:',
    thanks: "Grazie per l'aiuto!",
    allergens: {
      milk: 'Latte e latticini', egg: 'Uova', fish: 'Pesce', shellfish: 'Crostacei e molluschi',
      treenuts: 'Frutta a guscio (noci, mandorle, anacardi, ecc.)', peanut: 'Arachidi', wheat: 'Grano / frumento',
      gluten: 'Glutine (grano, orzo, segale)', soy: 'Soia', sesame: 'Sesamo', mustard: 'Senape', celery: 'Sedano',
      lupin: 'Lupini', sulfites: 'Solfiti', corn: 'Mais',
    },
  },
  {
    code: 'de', label: 'Deutsch',
    title: 'Ich habe Lebensmittelallergien',
    intro: 'Bitte stellen Sie sicher, dass mein Essen Folgendes nicht enthält – auch keine Spuren und keinen Kontakt über gemeinsam genutzte Flächen, Öl oder Utensilien:',
    severe: 'Das ist ernst. Schon eine kleine Menge kann mich sehr krank machen.',
    other: 'Außerdem:',
    thanks: 'Vielen Dank für Ihre Hilfe!',
    allergens: {
      milk: 'Milch und Milchprodukte', egg: 'Ei', fish: 'Fisch', shellfish: 'Krebstiere und Weichtiere',
      treenuts: 'Schalenfrüchte (Walnüsse, Mandeln, Cashews usw.)', peanut: 'Erdnüsse', wheat: 'Weizen',
      gluten: 'Gluten (Weizen, Gerste, Roggen)', soy: 'Soja', sesame: 'Sesam', mustard: 'Senf', celery: 'Sellerie',
      lupin: 'Lupinen', sulfites: 'Sulfite', corn: 'Mais',
    },
  },
  {
    code: 'pt', label: 'Português',
    title: 'Tenho alergias alimentares',
    intro: 'Por favor, verifique se minha comida não contém os itens abaixo, nem traços ou contaminação cruzada por superfícies, óleo ou utensílios compartilhados:',
    severe: 'É sério. Mesmo uma pequena quantidade pode me fazer muito mal.',
    other: 'Também:',
    thanks: 'Obrigado pela ajuda!',
    allergens: {
      milk: 'Leite e derivados', egg: 'Ovo', fish: 'Peixe', shellfish: 'Crustáceos e moluscos (frutos do mar)',
      treenuts: 'Castanhas e nozes (amêndoa, caju, nozes etc.)', peanut: 'Amendoim', wheat: 'Trigo',
      gluten: 'Glúten (trigo, cevada, centeio)', soy: 'Soja', sesame: 'Gergelim', mustard: 'Mostarda',
      celery: 'Aipo / salsão', lupin: 'Tremoço', sulfites: 'Sulfitos', corn: 'Milho',
    },
  },
  {
    code: 'ja', label: '日本語',
    title: '私には食物アレルギーがあります',
    intro: '私の料理に以下のものが入らないようにしてください。微量や、共用の調理器具・油・調理台からの混入も避けてください：',
    severe: '深刻なアレルギーです。少量でも重い症状が出ることがあります。',
    other: 'その他：',
    thanks: 'ご協力ありがとうございます！',
    allergens: {
      milk: '乳・乳製品', egg: '卵', fish: '魚', shellfish: '甲殻類・貝類（えび、かに、貝など）',
      treenuts: '木の実類（くるみ、アーモンド、カシューナッツなど）', peanut: '落花生（ピーナッツ）', wheat: '小麦',
      gluten: 'グルテン（小麦、大麦、ライ麦）', soy: '大豆', sesame: 'ごま', mustard: 'マスタード（からし）',
      celery: 'セロリ', lupin: 'ルピナス', sulfites: '亜硫酸塩', corn: 'とうもろこし',
    },
  },
  {
    code: 'zh', label: '中文',
    title: '我有食物过敏',
    intro: '请确保我的食物不含以下成分，包括微量成分，以及因共用的台面、油或餐具造成的交叉污染：',
    severe: '这很严重。即使少量也可能让我病得很厉害。',
    other: '其他：',
    thanks: '谢谢您的帮助！',
    allergens: {
      milk: '牛奶及乳制品', egg: '鸡蛋', fish: '鱼', shellfish: '贝类和甲壳类（虾、蟹等）',
      treenuts: '坚果（核桃、杏仁、腰果等）', peanut: '花生', wheat: '小麦', gluten: '麸质（小麦、大麦、黑麦）',
      soy: '大豆', sesame: '芝麻', mustard: '芥末', celery: '芹菜', lupin: '羽扇豆', sulfites: '亚硫酸盐', corn: '玉米',
    },
  },
];
