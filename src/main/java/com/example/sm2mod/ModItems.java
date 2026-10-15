package com.example.sm2mod;

import net.minecraft.core.registries.Registries;
import net.minecraft.network.chat.Component;
import net.minecraft.world.item.ArmorItem;
import net.minecraft.world.item.CreativeModeTab;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.SwordItem;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModItems {
    public static final DeferredRegister<Item> ITEMS = DeferredRegister.create(ForgeRegistries.ITEMS, Sm2Mod.MODID);
    public static final DeferredRegister<CreativeModeTab> TABS = DeferredRegister.create(Registries.CREATIVE_MODE_TAB, Sm2Mod.MODID);

    // Ammo
    public static final RegistryObject<Item> BOLT_SHELL = ITEMS.register("bolt_shell",
            () -> new Item(new Item.Properties().stacksTo(64)));

    // Ranged weapons
    public static final RegistryObject<Item> BOLTER = ITEMS.register("bolter",
            () -> new BoltWeaponItem(new Item.Properties().stacksTo(1).durability(1200), 6.0D, 6));
    public static final RegistryObject<Item> BOLT_PISTOL = ITEMS.register("bolt_pistol",
            () -> new BoltWeaponItem(new Item.Properties().stacksTo(1).durability(900), 4.5D, 10));
    public static final RegistryObject<Item> MELTA_RIFLE = ITEMS.register("melta_rifle",
            () -> new MeltaItem(new Item.Properties().stacksTo(1).durability(64)));

    // Melee weapons
    public static final RegistryObject<Item> COMBAT_KNIFE = ITEMS.register("combat_knife",
            () -> new SwordItem(SpaceMarineTier.INSTANCE, 1, -1.8F, new Item.Properties()));
    public static final RegistryObject<Item> CHAINSWORD = ITEMS.register("chainsword",
            () -> new SwordItem(SpaceMarineTier.INSTANCE, 4, -2.6F, new Item.Properties()));
    public static final RegistryObject<Item> POWER_SWORD = ITEMS.register("power_sword",
            () -> new SwordItem(SpaceMarineTier.INSTANCE, 6, -2.2F, new Item.Properties()));

    // Grenade
    public static final RegistryObject<Item> FRAG_GRENADE = ITEMS.register("frag_grenade",
            () -> new GrenadeItem(new Item.Properties().stacksTo(16)));

    // Power armor
    public static final RegistryObject<Item> POWER_HELMET = ITEMS.register("power_helmet",
            () -> new ArmorItem(PowerArmorMaterial.INSTANCE, ArmorItem.Type.HELMET, new Item.Properties()));
    public static final RegistryObject<Item> POWER_CHESTPLATE = ITEMS.register("power_chestplate",
            () -> new ArmorItem(PowerArmorMaterial.INSTANCE, ArmorItem.Type.CHESTPLATE, new Item.Properties()));
    public static final RegistryObject<Item> POWER_LEGGINGS = ITEMS.register("power_leggings",
            () -> new ArmorItem(PowerArmorMaterial.INSTANCE, ArmorItem.Type.LEGGINGS, new Item.Properties()));
    public static final RegistryObject<Item> POWER_BOOTS = ITEMS.register("power_boots",
            () -> new ArmorItem(PowerArmorMaterial.INSTANCE, ArmorItem.Type.BOOTS, new Item.Properties()));

    public static final RegistryObject<CreativeModeTab> MAIN_TAB = TABS.register("main",
            () -> CreativeModeTab.builder()
                    .title(Component.translatable("itemGroup.sm2mod.main"))
                    .icon(() -> BOLTER.get().getDefaultInstance())
                    .displayItems((params, out) -> ITEMS.getEntries().forEach(i -> out.accept(i.get())))
                    .build());
}
