package com.example.sm2mod;

import net.minecraft.world.item.Tier;
import net.minecraft.world.item.crafting.Ingredient;

public class SpaceMarineTier implements Tier {
    public static final SpaceMarineTier INSTANCE = new SpaceMarineTier();

    @Override public int getUses() { return 1561; }
    @Override public float getSpeed() { return 8.0F; }
    @Override public float getAttackDamageBonus() { return 2.0F; }
    @Override public int getLevel() { return 4; }
    @Override public int getEnchantmentValue() { return 15; }
    @Override public Ingredient getRepairIngredient() { return Ingredient.of(net.minecraft.world.item.Items.NETHERITE_INGOT); }
}
